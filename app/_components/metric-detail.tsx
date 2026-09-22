'use client';

import { useId, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import type { BusinessPayload, BusinessSnapshot } from './business-world-restored';

export function Metric({ label, value, data, snapshot, field, icon: Icon = BarChart3 }: {
  label: string; value: number | null | undefined; data: BusinessPayload | null;
  snapshot?: BusinessSnapshot | null; field: string; icon?: typeof BarChart3;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const valueText = value == null ? '未提供' : value.toLocaleString('zh-CN');
  const state = value == null ? '待观测' : data?.meta.dataMode === 'simulated' ? '合成演示 · 非真实观测' : '经营快照';
  const close = () => { dialog.current?.close(); trigger.current?.focus(); };
  return <>
    <button ref={trigger} type="button" className="metric metric-detail-trigger" aria-label={`${label}：${valueText}，查看指标详情`} onClick={() => dialog.current?.showModal()}>
      <span className="metric-label">{label}<Icon size={22}/></span><strong className="metric-value">{value == null ? '—' : valueText}</strong><span className="metric-sub">{state}</span><span className="text-link">查看指标详情</span>
    </button>
    <dialog ref={dialog} className="campaign-review-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}>
      <div className="section-title"><h2 id={titleId}>{label} · 指标详情</h2><button type="button" onClick={close}>关闭指标详情</button></div>
      <dl className="detail-list">
        <div><dt>快照值</dt><dd>{valueText}</dd></div><div><dt>状态</dt><dd>{state}</dd></div>
        <div><dt>对应字段</dt><dd>{field}</dd></div>
        <div><dt>来源</dt><dd>{snapshot?.provenance.sourceLabel ?? '未提供'}</dd></div>
        <div><dt>数据服务</dt><dd>{snapshot?.provenance.provider ?? '未提供'}</dd></div>
        <div><dt>观测时间</dt><dd>{snapshot?.provenance.asOf ?? '未提供'}</dd></div>
        <div><dt>快照更新时间</dt><dd>{snapshot?.provenance.updatedAt ?? '未提供'}</dd></div>
        <div><dt>快照版本</dt><dd>{data?.meta.datasetVersion ?? '未提供'}</dd></div>
      </dl>
      <p>该指标直接读取所列快照字段；单位以指标标题为准。快照尚未提供独立统计窗口、计算分母或完整归因口径，不据此计算趋势或因果收益。</p>
      <p>{value == null ? '缺少该指标，不能当作零值或正常状态。' : data?.meta.dataMode === 'simulated' ? '这是合成演示值，不代表真实经营表现。' : '请以来源和观测时间核对适用范围；持久化不代表实时或已经独立验证。'}</p>
    </dialog>
  </>;
}
