'use client';

import { useState } from 'react';
import { campaignRiskGroups, type CampaignRiskKind } from '@/lib/business-world/campaign-risk';
import { entityHref } from '@/lib/business-world/entity-links';
import type { BusinessPayload } from './business-world-restored';

const amount = (value: number | null) => value === null || !Number.isFinite(value) ? '未提供有效数值' : `${value.toLocaleString('zh-CN')} 元`;

export function CampaignRiskPanel({ data, onSource }: { data: BusinessPayload | null; onSource?: () => void }) {
  const [selected, setSelected] = useState<CampaignRiskKind>('budget-difference');
  const groups = campaignRiskGroups(data?.ads.campaigns ?? []);
  const rows: Array<{ campaign: BusinessPayload['ads']['campaigns'][number]; excess?: number; percent?: number | null }> = selected === 'budget-difference' ? groups.difference : groups.invalid;
  return <section className="panel campaign-risk-panel" aria-labelledby="campaign-risk-title">
    <div className="section-title"><h2 id="campaign-risk-title">风险核查</h2><small>{data?.meta.dataMode === 'simulated' ? '合成演示数据' : '当前快照'}</small></div>
    <p>比较当前快照中每项活动的消耗与预算。统计周期及预算规则尚未核对，数值差异不等于已确认超支。</p>
    <div className="campaign-risk-options" role="group" aria-label="按风险项查看活动">
      <button aria-pressed={selected === 'budget-difference'} aria-controls="campaign-risk-results" onClick={() => setSelected('budget-difference')}>消耗高于预算（{groups.difference.length}）</button>
      <button aria-pressed={selected === 'invalid-values'} aria-controls="campaign-risk-results" onClick={() => setSelected('invalid-values')}>数值待核查（{groups.invalid.length}）</button>
    </div>
    <div id="campaign-risk-results" role="region" aria-label="风险项关联活动">
      <p role="status">{selected === 'budget-difference' ? '消耗高于预算' : '数值待核查'}：{rows.length} 项活动</p>
      {rows.length ? <ul>{rows.map(row => <li key={row.campaign.id}>
        <a href={entityHref('campaign', row.campaign.id)}>核查活动：{row.campaign.name}</a>
        <p>{row.campaign.channel || '未注明渠道'} · 预算 {amount(row.campaign.budget)} · 消耗 {amount(row.campaign.spend)}</p>
        {row.excess !== undefined ? <p>数值差额 {amount(row.excess)}；{row.percent == null ? '无有效预算比例，不计算百分比' : `高于预算 ${row.percent.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}%`}。先核对周期、预算类型和来源，再决定是否调整。</p> : <p>缺失、负数或非有限数值不能用于预算风险判断，请先核对来源。</p>}
      </li>)}</ul> : <p>{data?.ads.campaigns.length ? '当前快照没有符合此核查项的活动；不代表其他投放风险已排除。' : '暂无活动数据，无法进行风险核查。'}</p>}
    </div>
    <p>版本：{data?.meta.datasetVersion || '未提供'}。此处核查整份快照，不随左侧渠道筛选缩小范围。素材疲劳与归因延迟缺少对应数据，尚未评估。</p>
    {onSource && <button className="text-link" onClick={onSource}>查看风险核查来源</button>}
  </section>;
}
