import type { BusinessSnapshot } from '@/app/_components/business-world-restored';
import type { ScenarioRun } from './scenario-client';
import { personaEvidenceFields } from './persona-evidence';
import { entityHref, type EntityKind } from './entity-links';

export type SearchEntry = { id: string; kind: string; label: string; href: string; terms: string; fields?: Array<[string, string]> };
const value = (n: number | null, unit = '') => n == null ? '未观测' : `${n}${unit}`;
export function buildSearchIndex(snapshot: BusinessSnapshot | null, pages: ReadonlyArray<readonly [string, string]>, runs: ScenarioRun[] = []): SearchEntry[] {
  const entries: SearchEntry[] = pages.map(([id,label]) => ({ id:`page:${id}`, kind:'页面', label, href:`?screen=${id}`, terms:`${label} ${id}` }));
  const data = snapshot?.data;
  if (data && snapshot) {
    const mode = data.meta.dataMode === 'simulated' ? '合成演示 · 非真实观测' : '经营快照';
    const source: Array<[string,string]> = [['数据模式',mode],['来源',snapshot.provenance.sourceLabel],['观测时间',snapshot.provenance.asOf ?? '未指定'],['基线版本',data.meta.datasetVersion || '未指定'],['情景归属','当前保存基线，非已运行情景结果']];
    const add = (type:EntityKind,id:string,kind:string,label:string,screen:string,fields:Array<[string,string]>) => {
      const key = `${type}:${id}`;
      entries.push({ id:key, kind, label, href:entityHref(type,id), terms:[kind,label,...fields.flat(),...source.flat()].join(' '), fields:[...fields,...source] });
    };
    data.personas.forEach(p=>add('persona',p.id,'人群',p.title,'persona', [...personaEvidenceFields(p,data.meta.dataMode),['称呼',p.name],['需求',p.goal],['痛点',p.pain],['内容方向',p.content],['触发线索',p.trigger],['人群规模',value(p.population)],['转化率',value(p.conversionRate,'%')],['复购率',value(p.repeatRate,'%')]]));
    data.content.topTopics.forEach(p=>add('topic',p.title,'内容选题',p.title,'content',[['关联人群',p.persona],['机会标识',p.potential]]));
    data.commerce.products.forEach(p=>add('product',p.id,'商品',p.name,'product',[['尺码',p.size],['价格',value(p.price,' 元')],['GMV',value(p.gmv,' 元')],['转化率',value(p.conversionRate,'%')],['库存天数',value(p.stockDays)],['退款率',value(p.refundRate,'%')]]));
    data.ads.campaigns.forEach(p=>add('campaign',p.id,'广告活动',p.name,'growth',[['渠道',p.channel],['状态',p.status],['预算',value(p.budget,' 元')],['消耗',value(p.spend,' 元')],['ROI',value(p.roi)],['CTR',value(p.ctr,'%')],['CPA',value(p.cpa,' 元')]]));
    data.live.sessions.forEach(p=>add('session',p.id,'直播场次',p.title,'live',[['场次时长',value(p.durationMin,' 分钟')],['观看人数',value(p.watchUv)],['支付订单',value(p.paidOrders)],['GMV',value(p.gmv,' 元')],['加购率',value(p.cartRate,'%')]]));
    entries.push({ id:'evidence:source', kind:'证据来源', label:snapshot.provenance.sourceLabel, href:'?screen=overview&source=1', terms:`证据 来源 数据 source evidence ${snapshot.provenance.sourceLabel} ${mode}` });
  }
  runs.forEach(run=>entries.push({id:`scenario:${run.id}`,kind:'已保存情景',label:run.prompt,href:`?screen=experiment&run=${encodeURIComponent(run.id)}`,terms:`情景 实验 scenario ${run.id} ${run.prompt} ${run.lever} ${run.changePercent} ${run.createdAt}`}));
  return entries;
}
export function searchEntries(entries: SearchEntry[], query: string) {
  const terms = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const rank = (entry: SearchEntry) => terms.filter(term=>`${entry.kind} ${entry.label}`.normalize('NFKC').toLocaleLowerCase().includes(term)).length;
  return entries.filter(entry=>terms.every(term=>entry.terms.normalize('NFKC').toLocaleLowerCase().includes(term))).sort((a,b)=>rank(b)-rank(a));
}
