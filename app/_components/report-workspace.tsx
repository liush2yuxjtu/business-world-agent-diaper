'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { BusinessSnapshot } from './business-world-restored';
import { reportText, scenarioReportText, type SavedReport } from '@/lib/business-world/report-model';
import { readRun, type ScenarioRun } from '@/lib/business-world/scenario-client';
import { ReportEmailComposer } from './report-email-composer';
import { ReportSharePanel } from './report-share-panel';

const messages: Record<string, string> = {
  REPORT_INVALID: '请检查报告标题、读者和备注长度。',
  REPORT_CONFLICT: '这份报告已有更新。请保留未保存的备注，重新读取后再操作。',
  REPORT_MISSING: '当前浏览器未找到这份报告。',
  REPORT_SCENARIO_MISSING: '未找到关联情景，请从实验历史重新选择。',
  REPORT_UNAVAILABLE: '暂时无法确认报告读写结果，请稍后重新读取。',
  CROSS_ORIGIN: '请在当前应用页面内提交此操作。',
};
async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(messages[body?.code] || messages.REPORT_UNAVAILABLE);
  return body as T;
}
function safeError(cause: unknown) {
  return cause instanceof Error && Object.values(messages).includes(cause.message) ? cause.message : messages.REPORT_UNAVAILABLE;
}
const endpoint = '/api/business-world/reports';

export function ReportWorkspace({ snapshot, preview }: { snapshot: BusinessSnapshot | null; preview: (snapshot: BusinessSnapshot | null, navigationDisabled: boolean, sourceKey: string) => ReactNode }) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selected, setSelected] = useState<SavedReport | null>(null);
  const [title, setTitle] = useState('经营决策报告');
  const [audience, setAudience] = useState('管理层');
  const [composer, setComposer] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [emailReport, setEmailReport] = useState<SavedReport | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [sourceScenario, setSourceScenario] = useState<ScenarioRun | null>(null);
  const dirty = selected !== null && note !== selected.humanNote;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await readResponse<{ reports: SavedReport[] }>(await fetch(endpoint, { cache: 'no-store' }));
        const id = new URLSearchParams(location.search).get('report');
        const report = id ? await readResponse<SavedReport>(await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { cache: 'no-store' })) : null;
        if (alive) { setReports(list.reports); setSelected(report); setNote(report?.humanNote ?? ''); }
        const sourceId = id ? null : new URLSearchParams(location.search).get('scenario');
        if (sourceId) {
          if (alive) { setScenarioId(sourceId); setComposer(true); }
          const source = await readRun(sourceId);
          if (alive) { setSourceScenario(source); setTitle(`情景报告：${source.prompt}`.slice(0, 120)); }
        }
      } catch (cause) { if (alive) setError(safeError(cause)); }
      finally { if (alive) setBusy(false); }
    })();
    return () => { alive = false; };
  }, []);

  function select(report: SavedReport) {
    setSelected(report); setNote(report.humanNote);
    setScenarioId(null); setSourceScenario(null); setComposer(false);
    const url = new URL(location.href); url.searchParams.set('report', report.id);
    url.searchParams.delete('scenario');
    history.replaceState(null, '', url);
  }
  async function choose(id: string, keepNote = false) {
    setBusy(true); setError(''); setStatus('');
    try {
      const report = await readResponse<SavedReport>(await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { cache: 'no-store' }));
      if (keepNote) {
        setSelected(report);
        setStatus('已读取最新版本，你尚未保存的备注仍保留在编辑框中。');
      } else select(report);
    } catch (cause) { setError(safeError(cause)); }
    finally { setBusy(false); }
  }
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setStatus('');
    try {
      const saved = await readResponse<SavedReport>(await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, audience, ...(scenarioId ? { scenarioId } : {}) }) }));
      const verified = await readResponse<SavedReport>(await fetch(`${endpoint}?id=${saved.id}`, { cache: 'no-store' }));
      select(verified); setReports(current => [verified, ...current.filter(r => r.id !== verified.id)]);
      setComposer(false); setStatus('报告已保存并回读，来源快照已固定。');
    } catch (cause) { setError(safeError(cause)); }
    finally { setBusy(false); }
  }
  async function saveNote(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const updated = await readResponse<SavedReport>(await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selected.id, revision: selected.revision, note }) }));
      select(updated); setReports(current => current.map(r => r.id === updated.id ? updated : r));
      setStatus('人工备注已保存，自动摘要和来源快照保持不变。');
    } catch (cause) { setError(safeError(cause)); }
    finally { setBusy(false); }
  }
  async function exportFile(format: 'pdf' | 'pptx') {
    if (!selected || dirty) return;
    setBusy(true); setError(''); setStatus('');
    try {
      const response = await fetch(`${endpoint}/export?id=${selected.id}&revision=${selected.revision}&format=${format}`, { cache: 'no-store' });
      if (!response.ok) await readResponse(response);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `business-world-report-${selected.id}-v${selected.revision}.${format}`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(`${format === 'pdf' ? 'PDF' : 'PPT'} 已生成，下载已开始。`);
    } catch (cause) { setError(safeError(cause)); }
    finally { setBusy(false); }
  }
  function download() {
    if (!selected) return;
    const url = URL.createObjectURL(new Blob([reportText(selected)], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `business-world-report-${selected.id}.txt`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="report-workspace">
    <div className="report-toolbar"><div><h2>{selected?.title || '当前经营快照'}</h2><p>{selected ? `面向 ${selected.audience} · ${new Date(selected.createdAt).toLocaleString('zh-CN')}` : '尚未生成报告。新建后可保留此时的来源与摘要。'}</p></div><button className="primary" disabled={busy || dirty || (scenarioId ? !sourceScenario : !snapshot?.data)} onClick={() => setComposer(!composer)}>新建报告</button></div>
    <p className="soft-note">报告保存于数据库，通过当前浏览器访问。清除浏览器数据或换浏览器后无法自动找回，请及时下载留存。</p>
    {scenarioId && <section className="panel report-editor"><h3>从实验带入的情景</h3>{sourceScenario ? <p className="report-preserve-lines">{scenarioReportText(sourceScenario)}</p> : <p>情景尚未成功读取，暂不能生成报告。请返回实验历史重新选择。</p>}<p>生成报告将使用此实验保存时的完整基线，不使用下方当前经营快照替换历史。</p></section>}
    {composer && <form className="panel report-editor" onSubmit={create}><h3>新建报告</h3><label>报告标题<input autoFocus required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} disabled={busy}/></label><label>报告读者<input required maxLength={80} value={audience} onChange={e => setAudience(e.target.value)} disabled={busy}/></label><div className="report-actions"><button type="submit" className="primary" disabled={busy || (!!scenarioId && !sourceScenario)}>生成并保存报告</button><button type="button" disabled={busy} onClick={() => setComposer(false)}>取消</button></div></form>}
    <section className="panel report-editor"><label>历史报告<select value={selected?.id || ''} disabled={busy || dirty} onChange={e => { if (e.target.value) void choose(e.target.value); }}><option value="" disabled>选择已保存报告</option>{reports.map(report => <option key={report.id} value={report.id}>{report.title} · {new Date(report.createdAt).toLocaleString('zh-CN')}</option>)}</select></label>{!busy && !reports.length && <p>当前浏览器还没有保存的报告。</p>}{selected && <button type="button" disabled={busy} onClick={() => void choose(selected.id, dirty)}>重新读取当前报告</button>}</section>
    {error && <p role="alert" className="report-error">{error}</p>}{status && <p role="status">{status}</p>}{busy && <p role="status">正在处理报告…</p>}
    {selected && <section className="panel report-editor"><h3>自动生成摘要</h3><p className="report-preserve-lines">{selected.generatedSummary}</p><form onSubmit={saveNote}><label>人工备注<textarea maxLength={4000} rows={5} value={note} disabled={busy} onChange={e => setNote(e.target.value)}/></label><div className="report-actions"><button type="submit" className="primary" disabled={busy || !dirty}>保存备注</button><button type="button" disabled={busy || !dirty} onClick={() => setNote(selected.humanNote)}>放弃未保存修改</button><button type="button" onClick={download} disabled={busy || dirty}>下载文本</button><button type="button" onClick={() => void exportFile('pdf')} disabled={busy || dirty}>导出 PDF</button><button type="button" onClick={() => void exportFile('pptx')} disabled={busy || dirty}>导出 PPT</button></div>{dirty && <p>有未保存的备注。保存或放弃修改后，可切换报告与下载。</p>}</form><p>报告要点和下方数据来自生成时的快照；自动摘要由固定规则整理。页面顶部的数据源属于当前经营状态，本报告的历史来源请在下方“数据与依据”中核对。</p></section>}
    {selected?.scenario && <section className="panel report-editor"><h3>关联情景 · 推演结果，非实际发生</h3><p className="report-preserve-lines">{scenarioReportText(selected.scenario)}</p><a href={`/?screen=experiment&run=${selected.scenario.id}`}>返回来源实验</a></section>}
    {selected && <div className="report-actions"><button type="button" disabled={busy || dirty || emailReport !== null} onClick={() => setEmailReport(structuredClone(selected))}>发送到邮箱</button></div>}
    {emailReport && <ReportEmailComposer key={`${emailReport.id}:${emailReport.revision}`} report={emailReport} onClose={() => setEmailReport(null)}/>}
    {selected && <ReportSharePanel key={selected.id} report={selected} disabled={busy || dirty}/>}
    {selected
      ? preview(selected.snapshot, dirty, selected.id)
      : busy || error
        ? <p role="status">报告来源尚未成功读取，暂不展示依据。不会用当前经营数据替代历史报告。</p>
        : preview(snapshot, false, 'current')}
  </div>;
}
