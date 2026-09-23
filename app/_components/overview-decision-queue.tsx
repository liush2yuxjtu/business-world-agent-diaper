'use client';

import type { BusinessPayload } from './business-world-restored';
import { campaignRiskGroups } from '@/lib/business-world/campaign-risk';
import { stockReview } from '@/lib/business-world/product-stock';
import { entityHref } from '@/lib/business-world/entity-links';

export function OverviewDecisionQueue({ data }: { data: BusinessPayload | null }) {
  const campaigns = campaignRiskGroups(data?.ads.campaigns ?? []);
  const stock = stockReview(data?.commerce.products ?? [], 14)!;
  const topics = data?.content.topTopics ?? [];
  const alerts = [
    ...campaigns.difference.map(({ campaign, excess }) => ({ id: `budget:${campaign.id}`, href: entityHref('campaign', campaign.id), title: `${campaign.name}：消耗高于预算`, detail: `高出 ${excess.toLocaleString('zh-CN')} 元；请核对统计周期。` })),
    ...campaigns.invalid.map(({ campaign }) => ({ id: `budget-invalid:${campaign.id}`, href: entityHref('campaign', campaign.id), title: `${campaign.name}：预算数据待核查`, detail: '预算或消耗缺失、为负或无效，不能判断预算差异。' })),
    ...stock.low.map(product => ({ id: `stock:${product.id}`, href: entityHref('product', product.id), title: `${product.name}：库存天数需复核`, detail: `${product.stockDays} 天，达到本页人工核查阈值（≤14天）；不代表已发生缺货。` })),
    ...stock.unknown.map(product => ({ id: `stock-unknown:${product.id}`, href: entityHref('product', product.id), title: `${product.name}：库存数据待核查`, detail: '缺少有效库存天数，不能推断库存安全。' })),
  ];
  return <section className="panel" aria-label="告警与机会完整列表">
    <h2>告警与机会</h2>
    <p>来自当前经营快照。{data?.meta.dataMode === 'simulated' ? '合成演示信号，非真实经营告警。' : '仅核对快照值，不推测连续趋势。'}预算比较沿用投放页口径，库存采用人工核查阈值14天；内容选题是研究机会，不是收益保证。</p>
    {!data ? <p>尚未读取经营快照，不能确认告警或机会是否存在。</p> : <>
      <p>待核查信号 {alerts.length} 项 · 内容机会 {topics.length} 项</p>
      {topics.slice(0, 2).map(topic => <a key={topic.title} className="decision-row" href={entityHref('topic', topic.title)}><div><h3>{topic.title}</h3><p>{topic.persona} · {topic.potential}</p></div><span>查看选题</span></a>)}
      <details><summary>查看全部告警与机会（{alerts.length + topics.length}项）</summary>
        <h3>待核查信号</h3>
        {alerts.length ? alerts.map(alert => <a key={alert.id} className="action-row" href={alert.href}><span><b>{alert.title}</b><small>{alert.detail}</small></span><span>查看依据</span></a>) : <p>当前快照没有触发上述核查条件，不代表经营没有风险。</p>}
        <h3>全部内容机会</h3>
        {topics.map(topic => <a key={topic.title} className="action-row" href={entityHref('topic', topic.title)}><span><b>{topic.title}</b><small>{topic.persona} · {topic.potential}</small></span><span>查看选题</span></a>)}
        {!topics.length && <p>当前快照没有内容选题。</p>}
      </details>
    </>}
  </section>;
}
