import { z } from 'zod';

// Scores must carry their definition; neither list order nor a high/low tag is a coordinate.
export const topicOpportunitySchema = z.object({
  competition: z.number().finite().min(0).max(100),
  opportunity: z.number().finite().min(0).max(100),
  source: z.string().trim().min(1).max(300),
  methodology: z.string().trim().min(1).max(1000),
  asOf: z.string().datetime(),
  mode: z.enum(['observed', 'inferred', 'simulated']),
});
export type TopicOpportunity = z.infer<typeof topicOpportunitySchema>;
export function topicOpportunity(value: unknown, dataMode: string): TopicOpportunity | null {
  const parsed = topicOpportunitySchema.safeParse(value);
  if (!parsed.success) return null;
  return {...parsed.data, mode: dataMode === 'simulated' ? 'simulated' : parsed.data.mode};
}
export const opportunityModeLabels = {observed:'已观测评分', inferred:'推断评分 · 非直接观测', simulated:'合成评分 · 非真实经营数据'};
