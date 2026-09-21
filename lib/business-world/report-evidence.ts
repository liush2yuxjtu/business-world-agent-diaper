import type { BusinessSnapshot } from '@/app/_components/business-world-restored';
import { buildSearchIndex } from './search-model';

export const reportEvidenceSections = [
  ['overview','经营基线'], ['persona','消费者需求'], ['content','内容'],
  ['live','直播'], ['growth','投放'], ['product','商品'],
] as const;
export type ReportEvidenceSection = typeof reportEvidenceSections[number][0];
export function reportSectionTarget(title: string): ReportEvidenceSection {
  const known: Record<string, ReportEvidenceSection> = { '经营概览':'overview', '内容复盘':'content', '直播复盘':'live', '投放分析':'growth', '商品建议':'product', '风险与机会':'overview' };
  return known[title.trim()] ?? 'overview';
}
const prefixes: Record<ReportEvidenceSection, string | null> = { overview: null, persona: 'persona:', content: 'topic:', live: 'session:', growth: 'campaign:', product: 'product:' };
const metric = (n: number | null | undefined, unit = '') => n == null ? '未提供' : `${n.toLocaleString('zh-CN')}${unit}`;

// Only the selected report snapshot enters this boundary; never refetch the live state here.
export function reportEvidence(snapshot: BusinessSnapshot | null, section: ReportEvidenceSection) {
  const data = snapshot?.data;
  if (!snapshot || !data) return null;
  const metrics: Record<ReportEvidenceSection, Array<[string,string]>> = {
    overview: [['商品 GMV',metric(data.commerce.gmv,' 元')],['投放 ROI',metric(data.ads.roi)],['内容互动率',metric(data.content.engagementRate,'%')],['直播支付订单',metric(data.live.paidOrders,' 单')]],
    persona: [['人群档案数量',metric(data.personas.length)],['证据口径','逐人群查看；档案数量不等于客户人数']],
    content: [['整体播放次数',metric(data.content.totalPlays)],['整体互动次数',metric(data.content.interactions)],['整体互动率',metric(data.content.engagementRate,'%')]],
    live: [['观看人数',metric(data.live.watchUv)],['支付订单',metric(data.live.paidOrders,' 单')],['直播 GMV',metric(data.live.gmv,' 元')]],
    growth: [['预算',metric(data.ads.budget,' 元')],['消耗',metric(data.ads.spend,' 元')],['ROI',metric(data.ads.roi)],['CPA',metric(data.ads.cpa,' 元')]],
    product: [['商品 GMV',metric(data.commerce.gmv,' 元')],['转化率',metric(data.commerce.conversionRate,'%')],['退款率',metric(data.commerce.refundRate,'%')]],
  };
  const prefix = prefixes[section];
  return {
    metrics: metrics[section],
    source: [
      ['数据模式',data.meta.dataMode === 'simulated' ? '合成演示 · 非真实观测' : '已保存经营快照'],
      ['来源',snapshot.provenance.sourceLabel],['观测时间',snapshot.provenance.asOf || '未指定'],
      ['来源更新时间',snapshot.provenance.updatedAt || '未指定'],['版本',data.meta.datasetVersion || '未指定'],
      ['报告周期',data.report.period || '未指定'],
    ] as Array<[string,string]>,
    entities: prefix ? buildSearchIndex(snapshot, []).filter(entry => entry.id.startsWith(prefix)).map(entry => ({
      id: entry.id, label: entry.label,
      fields: (entry.fields ?? []).map(([key,value]) => [key, key === '情景归属' ? '本报告预览所用的固定基线，非当前业务页面重新读取结果' : value] as [string,string]),
    })) : [],
    currentPageHref: `?screen=${section}`,
  };
}
