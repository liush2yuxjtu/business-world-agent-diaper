import type { SavedReport } from './report-model';

export type ReportSection = { heading: string; text: string };
const value = (number: number | null | undefined, unit = '') => number == null ? '暂无数据' : `${number.toLocaleString('zh-CN')}${unit}`;

// PDF and PPT consume exactly these sections from the same selected saved revision.
export function reportSections(report: SavedReport): ReportSection[] {
  const data = report.snapshot.data;
  return [
    { heading: '报告信息', text: [report.title, `读者：${report.audience}`, `周期：${report.period || '未指定'}`, `生成时间：${report.createdAt}`, data?.meta.dataMode === 'simulated' ? '合成数据演示，不代表真实经营结果。' : '基于已保存经营快照。'].join('\n') },
    { heading: '自动生成摘要', text: report.generatedSummary },
    { heading: '经营基线', text: [
      `商品 GMV：${value(data?.commerce.gmv, ' 元')}`,
      `投放 ROI：${value(data?.ads.roi)}`,
      `内容互动率：${value(data?.content.engagementRate, '%')}`,
      `直播支付订单：${value(data?.live.paidOrders)}`,
      `商品转化率：${value(data?.commerce.conversionRate, '%')}`,
      `退款率：${value(data?.commerce.refundRate, '%')}`,
      ...(data?.commerce.products ?? []).map(product => `${product.name} GMV：${value(product.gmv, ' 元')}`),
    ].join('\n') },
    { heading: '报告要点', text: data?.report.sections.join('\n') || '暂无报告要点' },
    { heading: '人工备注', text: report.humanNote || '暂无人工备注' },
    { heading: '来源与适用边界', text: [
      `来源：${report.snapshot.provenance.sourceLabel}`,
      `观测时间：${report.snapshot.provenance.asOf || '未指定'}`,
      `来源更新时间：${report.snapshot.provenance.updatedAt || '未指定'}`,
      '数据固定于报告生成时；人工备注与自动摘要分别保存。',
      '情景推演不能替代真实实验，报告不构成自动投放或交易指令。',
    ].join('\n') },
  ];
}

// Preserve every Unicode code point and explicit line break, including long unbroken notes.
export function wrapReportText(text: string, width: number, measure: (text: string) => number) {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n')) {
    let line = '';
    for (const character of Array.from(paragraph)) {
      if (line && measure(line + character) > width) { lines.push(line); line = ''; }
      line += character;
    }
    lines.push(line);
  }
  return lines;
}
