import { z } from 'zod';

const source = z.string().trim().min(1).max(2000);
export const personaEvidenceSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('observed'), source, asOf: z.string().datetime({ offset: true }) }),
  z.object({ state: z.literal('inferred'), source, asOf: z.string().datetime({ offset: true }), confidence: z.number().min(0).max(100), signals: z.array(source).min(1).max(20) }),
  z.object({ state: z.literal('template'), source }),
  z.object({ state: z.literal('simulated'), source }),
]);
export type PersonaEvidence = z.infer<typeof personaEvidenceSchema>;
export const personaStateLabels = { observed: '已观测', inferred: '推断', template: '模板', simulated: '模拟', unverified: '待核验' } as const;
export type PersonaState = keyof typeof personaStateLabels;
export const personaMetricNotes: Record<PersonaState,string> = {
  observed: '指标随人群证据提供，以来源定义和观测时间为准',
  inferred: '推断指标，不等于直接观测结果',
  template: '模板假设值，非实测指标',
  simulated: '模拟值，非客户观测',
  unverified: '指标尚待核验，不能确认观测属性',
};
export function personaState(person: { evidence?: PersonaEvidence }, mode: string): PersonaState {
  // A synthetic dataset never supplies measured evidence, even if an individual label claims it does.
  if (mode === 'simulated') return 'simulated';
  return person.evidence?.state ?? 'unverified';
}
export function personaEvidenceFields(person: { evidence?: PersonaEvidence }, mode: string): Array<[string,string]> {
  const state = personaState(person, mode);
  const fields: Array<[string,string]> = [['人群证据状态', personaStateLabels[state]], ['指标口径', personaMetricNotes[state]]];
  const evidence = person.evidence;
  if (evidence && mode !== 'simulated') {
    fields.push(['人群来源', evidence.source]);
    if ('asOf' in evidence) fields.push(['证据时间', evidence.asOf]);
    if (evidence.state === 'inferred') fields.push(['置信度', `${evidence.confidence}%`], ['推断信号', evidence.signals.join('；')]);
  }
  if (state === 'template' || state === 'simulated') fields.push(['使用边界', '非真实客户观测，不作为实测人群规模或转化证据']);
  if (state === 'unverified') fields.push(['使用边界', '尚未提供逐人群证据状态，不能确认是实测、推断或模板']);
  return fields;
}
