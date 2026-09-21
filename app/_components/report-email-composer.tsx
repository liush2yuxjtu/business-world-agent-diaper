'use client';

import { useState, type FormEvent } from 'react';
import type { SavedReport } from '@/lib/business-world/report-model';
import { composeReportEmail, reportEmailFile } from '@/lib/business-world/report-email';

export function ReportEmailComposer({ report, onClose }: { report: SavedReport; onClose: () => void }) {
  const [draft, setDraft] = useState(() => composeReportEmail(report));
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function download(event: FormEvent) {
    event.preventDefault(); setStatus(''); setError('');
    try {
      const content = reportEmailFile(draft);
      const url = URL.createObjectURL(new Blob([content], { type: 'message/rfc822' }));
      const link = document.createElement('a');
      link.href = url; link.download = `business-world-report-${report.id}-v${report.revision}.eml`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('邮件草稿已下载，尚未发送。请在邮件软件中检查收件人和正文后发送。');
    } catch {
      setError('请填写一个有效邮箱、单行主题和正文后再下载。');
    }
  }

  return <section className="panel report-editor" aria-label="报告邮件草稿">
    <h3>发送到邮箱：准备草稿</h3>
    <p>来自「{report.title}」第 {report.revision} 版，生成后保持固定。草稿仅在当前页面编辑；请下载留存，关闭后重新打开会恢复报告原文。</p>
    <form onSubmit={download}>
      <label>收件邮箱<input autoFocus type="email" required maxLength={254} value={draft.recipient} onChange={e => setDraft({ ...draft, recipient: e.target.value })}/></label>
      <label>邮件主题<input required maxLength={200} value={draft.subject} onChange={e => setDraft({ ...draft, subject: e.target.value })}/></label>
      <label>邮件正文<textarea required maxLength={20000} rows={12} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })}/></label>
      <p>下载包含报告文字与人工备注。需要附件时，请另行添加已下载的 PDF 或 PPT。</p>
      <div className="report-actions"><button type="submit" className="primary">下载邮件草稿</button><button type="button" onClick={onClose}>关闭草稿</button></div>
    </form>
    {error && <p role="alert" className="report-error">{error}</p>}
    {status && <p role="status">{status}</p>}
  </section>;
}
