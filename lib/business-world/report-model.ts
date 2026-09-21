import type { BusinessPayload, BusinessSnapshot } from '@/app/_components/business-world-restored';
import type { ScenarioRun } from './scenario-client';
import { presentSnapshot } from './presentation';

export type SavedReport = {
  id: string;
  title: string;
  audience: string;
  period: string;
  createdAt: string;
  revision: number;
  generatedSummary: string;
  humanNote: string;
  snapshot: BusinessSnapshot;
  scenario?: ScenarioRun;
};

const metric = (value: number | null | undefined, unit = '') => value == null ? '暂无数据' : `${value.toLocaleString('zh-CN')}${unit}`;

// Keep the report's source frozen: later edits to the live state must not rewrite history.
export function composeReport(snapshot: BusinessSnapshot, input: { id: string; title: string; audience: string }, createdAt: string): SavedReport {
  if (!snapshot.data) throw new Error('Report requires a baseline');
  const source = structuredClone(snapshot);
  const data = source.data!;
  return {
    ...input, createdAt, revision: 1, period: data.report.period,
    generatedSummary: [
      data.meta.dataMode === 'simulated' ? '合成数据演示；以下数字不是实际经营结果。' : '基于已保存经营快照。',
      `商品 GMV：${metric(data.commerce.gmv, ' 元')}；投放 ROI：${metric(data.ads.roi)}。`,
      `内容互动率：${metric(data.content.engagementRate, '%')}；直播支付订单：${metric(data.live.paidOrders)}。`,
      data.report.summary,
    ].filter(Boolean).join('\n'),
    humanNote: '', snapshot: source,
  };
}

export function reportText(report: SavedReport) {
  return [report.title, `面向：${report.audience}`, `周期：${report.period || '未指定'}`,
    `来源：${report.snapshot.provenance.sourceLabel}`, `观测时间：${report.snapshot.provenance.asOf || '未指定'}`,
    '自动生成摘要', report.generatedSummary, ...(report.snapshot.data?.report.sections ?? []),
    ...(report.scenario ? ['关联情景 · 推演结果，非实际发生', scenarioReportText(report.scenario)] : []),
    '人工备注', report.humanNote || '暂无人工备注', `报告生成时间：${report.createdAt}`].join('\n\n');
}

export function scenarioReportText(scenario: ScenarioRun) {
  const labels: Record<string, string> = { ad_efficiency: '投放效率', content_engagement: '内容互动', live_watch_time: '直播观看', checkout_conversion: '交易转化', repeat_purchase: '复购' };
  return [`情景：${scenario.prompt}`, `假设：${labels[scenario.lever] ?? '所选变量'}变化 ${scenario.changePercent}%`,
    `基线 ROI：${metric(scenario.result.baselineRoi)} → 推演 ROI：${metric(scenario.result.modeledRoi)}`,
    `基线转化率：${metric(scenario.result.baselineConversionRate, '%')} → 推演转化率：${metric(scenario.result.modeledConversionRate, '%')}`,
    `情景保存时间：${scenario.createdAt}`, `情景编号：${scenario.id}`,
    ...(scenario.result.context ? [`研究对象：${scenario.result.context.entity?.label ?? '整体经营'}`, `基线来源：${scenario.result.context.baseline.sourceLabel}`, `基线编号：${scenario.result.context.baseline.stateId}`, `基线版本：${scenario.result.context.baseline.datasetVersion}`, `来源观测时间：${scenario.result.context.baseline.observedAt}`] : ['原记录未保存来源观测时间，报告不推测该时间。']),
    '单一变量方向性推演，不代表真实经营结果；研究对象不等于实体级归因。'].join('\n');
}

export function composeScenarioReport(baseline: BusinessPayload, scenario: ScenarioRun, input: { id: string; title: string; audience: string }, createdAt: string) {
  if (baseline.ads.roi !== scenario.result.baselineRoi || baseline.commerce.conversionRate !== scenario.result.baselineConversionRate) throw new Error('Scenario baseline mismatch');
  const snapshot: BusinessSnapshot = presentSnapshot({
    data: structuredClone(baseline),
    provenance: { sourceMode: baseline.meta.dataMode === 'simulated' ? 'simulated' : 'persisted-observation', provider: '已保存实验', sourceLabel: '实验保存时的经营基线', asOf: null, updatedAt: scenario.createdAt, storage: 'persisted', writable: false },
  });
  return { ...composeReport(snapshot, input, createdAt), scenario: structuredClone(scenario) };
}
