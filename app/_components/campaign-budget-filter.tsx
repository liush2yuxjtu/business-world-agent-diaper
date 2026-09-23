'use client';

import { budgetSlicePath, campaignBudgetGroups } from '@/lib/business-world/campaign-budget';

export function CampaignBudgetFilter({ campaigns, selected, onSelect }: {
  campaigns: Array<{ channel: string; budget: number }>;
  selected: string | null;
  onSelect: (channel: string | null) => void;
}) {
  const allocation = campaignBudgetGroups(campaigns);
  if (!allocation) return <p role="status">活动预算包含无效数值，无法绘制分配图。活动列表仍可查看。</p>;
  let start = 0;
  const slices = allocation.groups.map(group => {
    const path = budgetSlicePath(start, group.share);
    start += group.share;
    return { ...group, path };
  });
  const label = (g: typeof slices[number]) => `${g.channel || '未注明渠道'}：预算 ${g.budget.toLocaleString('zh-CN')} 元，${(g.share * 100).toFixed(1)}%，${g.count} 项活动`;
  return <>
    <p className="caption">按当前活动预算汇总，合计 {allocation.total.toLocaleString('zh-CN')} 元。点击扇区或渠道筛选活动；顶部指标仍为整份快照，不随筛选重算。</p>
    <div className="campaign-budget-filter">
      {allocation.total > 0 ? <svg viewBox="0 0 200 200" role="group" aria-label="按渠道预算筛选活动">
        {slices.filter(g => g.share > 0).map((g, i) => <path key={g.channel} d={g.path} className={`budget-slice budget-tone-${i % 4}`} role="button" tabIndex={0} aria-label={label(g)} aria-pressed={selected === g.channel} aria-controls="campaign-results" onClick={() => onSelect(g.channel)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(g.channel); } }}><title>{label(g)}</title></path>)}
      </svg> : <p>当前活动预算合计为 0，暂无可绘制的预算占比。</p>}
      <div className="campaign-budget-options" role="group" aria-label="活动渠道筛选">
        <button aria-pressed={selected === null} aria-controls="campaign-results" onClick={() => onSelect(null)}>全部渠道（{campaigns.length}）</button>
        {slices.map(g => <button key={g.channel} aria-label={label(g)} aria-pressed={selected === g.channel} aria-controls="campaign-results" onClick={() => onSelect(g.channel)}><b>{g.channel || '未注明渠道'}（{g.count}）</b><span>{g.budget.toLocaleString('zh-CN')} 元 · {allocation.total > 0 ? `${(g.share * 100).toFixed(1)}%` : '无占比'}</span></button>)}
      </div>
    </div>
  </>;
}
