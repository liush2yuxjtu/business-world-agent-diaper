import { z } from 'zod';

export const liveStages = [
  ['exposure', '曝光'], ['entry', '进房'], ['retained', '停留'],
  ['productClick', '点击商品'], ['cart', '加购'], ['paid', '支付'],
] as const;
export type LiveStage = typeof liveStages[number][0];
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable();

// Stage counts must refer to one cohort of unique people, not independent UVs or order counts.
export const liveFunnelSchema = z.object({
  source: z.string().trim().min(1).max(300),
  asOf: z.string().datetime(),
  period: z.string().trim().min(1).max(300),
  cohort: z.string().trim().min(1).max(500),
  methodology: z.string().trim().min(1).max(1200),
  unit: z.literal('unique_people'),
  mode: z.enum(['observed', 'simulated']),
  counts: z.object({ exposure: count, entry: count, retained: count, productClick: count, cart: count, paid: count }),
}).superRefine((value, ctx) => {
  let previous: number | null = null;
  for (const [stage] of liveStages) {
    const current = value.counts[stage];
    if (current === null) continue;
    if (previous !== null && current > previous) ctx.addIssue({ code: 'custom', path: ['counts', stage], message: '同一递进人群的后续阶段人数不能增加' });
    previous = current;
  }
});
export type LiveFunnel = z.infer<typeof liveFunnelSchema>;
export function readLiveFunnel(input: unknown, dataMode: string): LiveFunnel | null {
  const result = liveFunnelSchema.safeParse(input);
  return result.success ? { ...result.data, mode: dataMode === 'simulated' ? 'simulated' : result.data.mode } : null;
}
export function stageLeakage(funnel: LiveFunnel | null, stage: LiveStage) {
  const index = liveStages.findIndex(([id]) => id === stage);
  if (!funnel || index <= 0) return null;
  const before = funnel.counts[liveStages[index - 1][0]], after = funnel.counts[stage];
  if (before === null || after === null || before <= 0) return null;
  return { before, after, lost: before - after, conversion: after / before * 100, lossRate: (before - after) / before * 100 };
}
