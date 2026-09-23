'use client';

import { useEffect, useRef, useState } from 'react';
import type { BusinessPayload } from './business-world-restored';

export function CampaignReview({ data, onSource }: { data: BusinessPayload | null; onSource?: () => void }) {
  const [selected, setSelected] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const campaigns = data?.ads.campaigns ?? [];
  const campaign = campaigns.find(item => item.id === selected);
  useEffect(() => {
    if (campaign && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [campaign]);
  const close = () => { dialog.current?.close(); setSelected(''); trigger.current?.focus(); };
  return <section className="panel campaign-review-panel" aria-label="投放建议核查">
    <h2>先核查，再创建实验</h2>
    <p>复核活动预算、消耗与表现，形成待验证的优化假设。现有 ROI 不能证明新增预算的效果。</p>
    <p className="caption">{data?.meta.dataMode === 'simulated' ? '合成演示建议，非真实投放指令。' : '基于当前快照的核查建议，尚未执行。'}</p>
    <div className="campaign-review-list">{campaigns.map(item => <button key={item.id} onClick={event => { trigger.current = event.currentTarget; setSelected(item.id); }}>核查建议：{item.name}</button>)}</div>
    {!campaigns.length && <p>尚无活动数据，接入来源后才能形成活动核查与实验草稿。</p>}
    <dialog ref={dialog} className="campaign-review-dialog" aria-labelledby="campaign-review-title" onCancel={event => { event.preventDefault(); close(); }}>
      {campaign && <><div className="section-title"><h2 id="campaign-review-title">投放建议核查：{campaign.name}</h2><button type="button" aria-label="关闭投放建议核查" onClick={close}>关闭</button></div>
        <p><b>待核查 · 未执行</b></p><p>建议先核对消耗、归因时间窗和创意表现，再比较有限实验；此页不会调整预算、发布广告或启动投放。</p>
        <dl className="detail-list"><div><dt>渠道</dt><dd>{campaign.channel}</dd></div><div><dt>预算</dt><dd>{campaign.budget.toLocaleString('zh-CN')} 元</dd></div><div><dt>消耗</dt><dd>{campaign.spend.toLocaleString('zh-CN')} 元</dd></div><div><dt>ROI</dt><dd>{campaign.roi}</dd></div><div><dt>CTR</dt><dd>{campaign.ctr}%</dd></div><div><dt>来源版本</dt><dd>{data?.meta.datasetVersion || '未提供'}</dd></div><div><dt>数据性质</dt><dd>{data?.meta.dataMode === 'simulated' ? '合成演示，非真实观测' : '经营快照，需核对口径'}</dd></div></dl>
        <h3>创建前核对</h3><ul><li>是否为同一账户、币种及归因时间窗。</li><li>退款、转化延迟及创意疲劳是否已纳入。</li><li>实验幅度、观察周期和停止条件是否明确。</li></ul>
        <p>下一步只创建可编辑的模拟草稿。当前模型比较整体经营指标，不提供该活动的独立增量归因；运行、保存或任何外部操作都不会自动发生。</p>
        <div className="campaign-review-actions"><button type="button" onClick={() => { close(); onSource?.(); }}>查看来源详情</button><a className="primary" href={`?screen=experiment&entity=${encodeURIComponent(`campaign:${campaign.id}`)}&draft=campaign-review`}>新建实验草稿</a></div></>}
    </dialog>
  </section>;
}
