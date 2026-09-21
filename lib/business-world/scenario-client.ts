import { z } from 'zod';
import { publicErrorMessage } from './public-errors';

const resultSchema = z.object({
  assumption: z.string(),
  baselineRoi: z.number().nullable(),
  modeledRoi: z.number().nullable(),
  baselineConversionRate: z.number().nullable(),
  modeledConversionRate: z.number().nullable(),
});
export const runSchema = z.object({
  id: z.string().uuid(), prompt: z.string(), lever: z.string(),
  changePercent: z.number(), createdAt: z.string().datetime(), result: resultSchema,
});
export type ScenarioRun = z.infer<typeof runSchema>;
const savedSchema = z.object({ id: z.string().uuid(), persisted: z.literal(true), persistedAt: z.string().datetime(), result: resultSchema });

async function request(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(30000) });
  const body = await response.json();
  if (!response.ok) throw new Error(publicErrorMessage(body, 'HISTORY_FAILED'));
  return body;
}
export async function readRun(id: string) {
  const valid = z.string().uuid().parse(id);
  return runSchema.parse(await request(`/api/business-world/scenario?id=${encodeURIComponent(valid)}`));
}
export async function readHistory(query?: string) {
  return z.object({ runs: z.array(runSchema) }).parse(await request('/api/business-world/scenario' + (query === undefined ? '' : `?q=${encodeURIComponent(query)}`))).runs;
}
export async function saveScenario(input: {prompt: string; lever: string; changePercent: number}) {
  const saved = savedSchema.parse(await request('/api/business-world/scenario', {method: 'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify(input)}));
  const readback = await readRun(saved.id);
  if (readback.id !== saved.id) throw new Error('情景记录未能读回，请稍后从历史记录重试。');
  return readback;
}
