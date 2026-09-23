'use client';
import { useEffect, useState } from 'react';
import type { SharedReport } from '@/lib/business-world/report-share-model';

export function SharedReportReader() {
  const [report, setReport] = useState<SharedReport | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  async function read() {
    setBusy(true); setError(''); setReport(null);
    const params = new URLSearchParams(location.hash.slice(1));
    try {
      const response = await fetch('/api/business-world/reports/shared', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: params.get('id'), token: params.get('access') }) });
      if (!response.ok) { setError(response.status === 400 || response.status === 404 ? '分享已失效、已撤销或链接不完整。' : '暂时无法读取报告，请稍后重试。'); return; }
      setReport((await response.json()).report);
    } catch { setError('暂时无法读取报告，请稍后重试。'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void read(); }, []);
  return <main className="report-workspace" style={{ maxWidth: 900, margin: '32px auto', padding: '0 20px' }}>
    <h1>{report?.title ?? '只读分享报告'}</h1>
    <p>此页面仅展示已分享的固定报告版本。报告所有者可以撤销链接；内容可能包含合成数据或情景推演，请以报告说明为准。</p>
    {busy && <p role="status">正在读取分享报告…</p>}
    {error && <p role="alert">{error}</p>}
    {report && <><p>第 {report.revision} 版 · 生成于 {new Date(report.createdAt).toLocaleString('zh-CN')}</p>{report.sections.map((section, index) => <section className="panel report-editor" key={index}><h2>{section.heading}</h2><p className="report-preserve-lines">{section.text}</p></section>)}</>}
    <button disabled={busy} onClick={() => void read()}>重新读取分享</button>
  </main>;
}
