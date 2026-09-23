'use client';
import { useEffect, useState } from 'react';
import type { SavedReport } from '@/lib/business-world/report-model';
import type { ReportShare } from '@/lib/business-world/report-share-model';

const endpoint = '/api/business-world/reports/shares';
export function ReportSharePanel({ report, disabled }: { report: SavedReport; disabled: boolean }) {
  const [shares, setShares] = useState<ReportShare[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  async function refresh() {
    setBusy(true); setError('');
    try {
      const response = await fetch(`${endpoint}?reportId=${report.id}`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      setShares((await response.json()).shares);
    } catch { setError('暂时无法读取分享记录，请重新读取。'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, [report.id]);
  async function create() {
    setBusy(true); setError(''); setStatus('');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportId: report.id, revision: report.revision }) });
      if (!response.ok) { setError(response.status === 409 ? '报告已有更新，请重新读取报告后分享。' : '未能确认分享创建，请先重新读取分享记录。'); return; }
      const result: { share: ReportShare; token: string } = await response.json();
      setShares(current => [result.share, ...current]);
      setLink({ id: result.share.id, url: `${location.origin}/shared-report#id=${result.share.id}&access=${result.token}` });
      setConfirming(false); setStatus('只读分享已创建，7 天后到期。请复制链接给需要查看的人。');
    } catch { setError('无法确认分享创建，请先重新读取分享记录，避免重复创建。'); }
    finally { setBusy(false); }
  }
  async function revoke(id: string) {
    setBusy(true); setError(''); setStatus('');
    try {
      const response = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error();
      const { share } = await response.json();
      setShares(current => current.map(item => item.id === id ? share : item));
      if (link?.id === id) setLink(null);
      setStatus('分享已撤销，此链接无法再读取报告。已下载或复制的内容无法收回。');
    } catch { setError('未能确认撤销，请重新读取分享记录后重试。'); }
    finally { setBusy(false); }
  }
  return <section className="panel report-editor" aria-label="报告只读分享">
    <h3>只读分享</h3><p>分享所选报告的固定版本，包含人工备注和关联情景。持有链接的人可以查看和复制报告；不会获得其他报告或编辑权限。</p>
    <div className="report-actions"><button disabled={busy || disabled} onClick={() => setConfirming(!confirming)}>分享链接</button><button disabled={busy} onClick={() => void refresh()}>重新读取分享记录</button></div>
    {confirming && <div><p>将分享「{report.title}」第 {report.revision} 版，7 天后到期。请先检查报告和备注是否适合分享。</p><button className="primary" disabled={busy || disabled} onClick={() => void create()}>创建 7 天只读链接</button><button disabled={busy} onClick={() => setConfirming(false)}>取消分享</button></div>}
    {link && <div><label>新建分享链接<input readOnly value={link.url}/></label><button disabled={busy} onClick={async () => { try { await navigator.clipboard.writeText(link.url); setStatus('分享链接已复制。'); } catch { setError('复制未成功，请从链接框手动复制。'); } }}>复制分享链接</button><a href={link.url} target="_blank" rel="noopener noreferrer">查看只读页面</a><p>链接只在本次创建后显示；离开页面后如需新链接，请重新创建，并撤销不再使用的分享。</p></div>}
    {!shares.length && !busy && <p>尚无分享记录。</p>}
    {shares.map(share => <div key={share.id}><p>第 {share.revision} 版 · 创建于 {new Date(share.created_at).toLocaleString('zh-CN')} · 到期 {new Date(share.expires_at).toLocaleString('zh-CN')} · {share.revoked_at ? '已撤销' : new Date(share.expires_at).getTime() <= Date.now() ? '已到期' : '有效'}</p><button disabled={busy || !!share.revoked_at} onClick={() => void revoke(share.id)}>撤销分享</button></div>)}
    {status && <p role="status">{status}</p>}{error && <p role="alert" className="report-error">{error}</p>}
  </section>;
}
