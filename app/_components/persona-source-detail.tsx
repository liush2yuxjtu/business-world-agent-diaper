'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { BusinessPayload, BusinessSnapshot } from './business-world-restored';
import { entityHref } from '@/lib/business-world/entity-links';
import { personaEvidenceFields } from '@/lib/business-world/persona-evidence';

type Person = BusinessPayload['personas'][number];

export function PersonaSourceDetail({ person, snapshot, onSource }: {
  person: Person; snapshot: BusinessSnapshot | null; onSource?: () => void;
}) {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const fallback = useRef<HTMLAnchorElement>(null);
  const data = snapshot?.data;
  const matches = data?.personas.filter(item => item.id === sourceId) ?? [];
  const target = matches.length === 1 ? matches[0] : null;
  const fields = personaEvidenceFields(person, data?.meta.dataMode ?? '');
  const href = `${entityHref('persona', person.id)}&personaSource=${encodeURIComponent(person.id)}`;

  useEffect(() => {
    const read = () => setSourceId(new URLSearchParams(location.search).get('personaSource'));
    read(); window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);
  useEffect(() => {
    if (sourceId !== null && !dialog.current?.open) dialog.current?.showModal();
    if (sourceId === null && dialog.current?.open) dialog.current.close();
  }, [sourceId]);
  const close = () => {
    dialog.current?.close(); setSourceId(null);
    const url = new URL(location.href); url.searchParams.delete('personaSource');
    history.replaceState(null, '', url);
    (trigger.current?.isConnected ? trigger.current : fallback.current)?.focus();
  };
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); trigger.current = event.currentTarget;
    history.pushState(null, '', event.currentTarget.href); setSourceId(person.id);
  };
  return <>
    <dl className="detail-list persona-source-rows">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><a href={href} onClick={open} aria-label={`${person.name}：${label}，查看来源详情`}>{value}</a></dd></div>)}</dl>
    <a ref={fallback} className="text-link" href={href} onClick={open}>查看{person.name}的来源详情</a>
    <dialog ref={dialog} className="campaign-review-dialog persona-source-dialog" aria-labelledby="persona-source-title" onCancel={event => { event.preventDefault(); close(); }}>
      <div className="section-title"><h2 id="persona-source-title">{target ? `${target.name} · 人群来源详情` : '人群来源不可定位'}</h2><button type="button" aria-label="关闭人群来源详情" onClick={close}>关闭</button></div>
      {target ? <>
        <p>{target.title} · {target.goal}</p>
        <p>此链接定位当前快照中的这一人群，刷新后读取最新来源；不表示历史版本已固定。</p>
        <dl className="detail-list">
          <div><dt>人群标识</dt><dd>{target.id}</dd></div>
          {personaEvidenceFields(target, data?.meta.dataMode ?? '').map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          <div><dt>快照来源</dt><dd>{snapshot?.provenance.sourceLabel || '未提供'}</dd></div>
          <div><dt>数据服务</dt><dd>{snapshot?.provenance.provider || '未提供'}</dd></div>
          <div><dt>快照版本</dt><dd>{data?.meta.datasetVersion || '未提供'}</dd></div>
          <div><dt>快照观测时间</dt><dd>{snapshot?.provenance.asOf || '未提供'}</dd></div>
          <div><dt>快照更新时间</dt><dd>{snapshot?.provenance.updatedAt || '未提供'}</dd></div>
          <div><dt>来源说明</dt><dd>{data?.notes || '未提供额外说明'}</dd></div>
        </dl>
        <p>{data?.meta.dataMode === 'simulated' ? '这些是数据库中的合成研究人群，不是客户观测；快照时间不代表真实客户观测发生时间。' : '快照元数据不替代逐人群来源。缺少逐人群证据时，仍不能确认观测属性。'}</p>
        {onSource && <button type="button" onClick={() => { close(); onSource(); }}>查看整份快照来源</button>}
      </> : <p role="alert">该人群标识在当前数据中缺失或重复，无法确定唯一来源。不会改用其他人群的证据。</p>}
    </dialog>
  </>;
}
