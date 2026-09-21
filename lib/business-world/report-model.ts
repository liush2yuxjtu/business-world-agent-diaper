import type { BusinessSnapshot } from '@/app/_components/business-world-restored';

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
    '人工备注', report.humanNote || '暂无人工备注', `报告生成时间：${report.createdAt}`].join('\n\n');
}
