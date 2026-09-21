'use client';

import { useEffect, useRef, useState } from 'react';
import type { BusinessPayload } from './business-world-restored';

type Session = BusinessPayload['live']['sessions'][number];
type Proposal = { session: Session; version: string; simulated: boolean; change: string; impact: string; rollback: string };

export function LiveActionReview({ data }: { data: BusinessPayload | null }) {
  const sessions = data?.live.sessions ?? [];
  const [sessionId, setSessionId] = useState('');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [feedback, setFeedback] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const session = sessions.find(item => item.id === sessionId) ?? sessions[0];
  useEffect(() => { if (proposal && !dialog.current?.open) dialog.current?.showModal(); }, [proposal]);
  const close = () => { dialog.current?.close(); setProposal(null); setAcknowledged(false); trigger.current?.focus(); };
  const open = (button: HTMLButtonElement) => {
    if (!session) return;
    trigger.current = button;
    setFeedback(''); setAcknowledged(false);
    setProposal({ session: { ...session }, version: data?.meta.datasetVersion ?? '未提供', simulated: data?.meta.dataMode === 'simulated',
      change: '在下一版讲解计划中增加一段尺码选择与夜间防漏说明，发布前逐条核对对应商品说明。',
      impact: '可能占用原有讲解时段；对停留与转化的影响尚未验证。不得承诺未经商品证据支持的效果。',
      rollback: '本次仅演示审核，不发布讲解计划。未来实际发布前须保存原计划；需要撤回时恢复原计划，并停止使用未核实的说明。',
    });
  };
  return <section className="panel" aria-label="直播执行前审核">
    <div className="section-title"><h2>直播行动提案</h2><small>人工确认演示 · 未执行</small></div>
    <p>先核对商品证据，再完善讲解。以下为固定研究提案，尚未经过真实 Agent 或效果验证。</p>
    <label htmlFor="live-review-session">目标场次</label>{' '}
    <select id="live-review-session" value={session?.id ?? ''} disabled={!sessions.length} onChange={event => { setSessionId(event.target.value); setFeedback(''); }}>
      {!sessions.length && <option value="">暂无场次</option>}
      {sessions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
    </select>
    <p>拟议变更：增加尺码选择与夜间防漏说明，逐条核对商品依据后再决定是否发布。</p>
    <button type="button" disabled={!session} onClick={event => open(event.currentTarget)}>去执行：审核讲解提案</button>
    {!session && <p>缺少场次来源，暂不能建立有明确目标的提案。</p>}
    <p role="status" aria-live="polite">{feedback}</p>
    <dialog ref={dialog} className="campaign-review-dialog" aria-labelledby="live-review-title" aria-describedby="live-review-boundary" onCancel={event => { event.preventDefault(); close(); }}>
      {proposal && <><div className="section-title"><h2 id="live-review-title">执行前人工确认</h2><button type="button" onClick={close} aria-label="关闭直播执行审核">关闭</button></div>
        <p id="live-review-boundary"><strong>演示审核：不会发布、投放或修改外部平台。</strong>本次确认只用于体验流程，不构成生产执行授权，也不会保存批准记录。</p>
        <dl className="detail-list"><div><dt>目标场次</dt><dd>{proposal.session.title}</dd></div><div><dt>目标平台账户</dt><dd>未连接；不具备外部执行条件</dd></div><div><dt>当前依据</dt><dd>观看 {proposal.session.watchUv.toLocaleString('zh-CN')} 人 · 支付 {proposal.session.paidOrders.toLocaleString('zh-CN')} 单 · 加购率 {proposal.session.cartRate}%</dd></div><div><dt>来源版本</dt><dd>{proposal.version}</dd></div><div><dt>数据性质</dt><dd>{proposal.simulated ? '合成演示数据，非真实经营表现' : '当前经营快照；指标本身不证明建议有效'}</dd></div><div><dt>拟议变更</dt><dd>{proposal.change}</dd></div><div><dt>预期影响与风险</dt><dd>{proposal.impact}</dd></div><div><dt>撤回方式</dt><dd>{proposal.rollback}</dd></div></dl>
        <p>实际执行仍需明确平台账户、最终讲解文本及商品证据，再单独批准；本页没有连接外部执行器。</p>
        <label><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/> 我已核对目标与变更，并理解此次仅为演示审核。</label>
        <div className="campaign-review-actions"><button type="button" onClick={close}>取消</button><button type="button" disabled={!acknowledged} onClick={() => { setFeedback(`已完成「${proposal.session.title}」的演示审核；未执行外部操作，未保存批准记录。`); close(); }}>确认演示（不执行）</button></div>
      </>}
    </dialog>
  </section>;
}
