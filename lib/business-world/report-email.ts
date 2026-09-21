import { reportText, type SavedReport } from './report-model';

export type ReportEmailDraft = { recipient: string; subject: string; body: string };

export function composeReportEmail(report: SavedReport): ReportEmailDraft {
  return {
    recipient: '',
    subject: report.title,
    body: `您好，\n\n请查收以下经营报告。\n\n${reportText(report)}\n\n报告编号：${report.id}\n报告版本：${report.revision}\n情景推演不能替代真实实验；本报告不构成自动投放或交易指令。`,
  };
}

// A single ASCII mailbox is intentional: no display-name or header syntax is accepted.
export function validReportRecipient(value: string) {
  return value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value);
}

function base64Utf8(value: string) {
  return btoa(Array.from(new TextEncoder().encode(value), byte => String.fromCharCode(byte)).join(''));
}

export function reportEmailFile(draft: ReportEmailDraft) {
  if (!validReportRecipient(draft.recipient) || !draft.subject.trim() || /[\r\n]/.test(draft.subject) || draft.subject.length > 200 || !draft.body.trim() || draft.body.length > 20000) {
    throw new Error('REPORT_EMAIL_INVALID');
  }
  // RFC 2047 encoded words stay under 75 characters, even for four-byte characters.
  const chars = Array.from(draft.subject.trim());
  const subject = [];
  for (let i = 0; i < chars.length; i += 10) subject.push(`=?UTF-8?B?${base64Utf8(chars.slice(i, i + 10).join(''))}?=`);
  const body = base64Utf8(draft.body.replace(/\r?\n/g, '\r\n')).match(/.{1,76}/g)?.join('\r\n') ?? '';
  return [
    `To: ${draft.recipient}`, `Subject: ${subject.join('\r\n ')}`,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64', 'X-Unsent: 1', '', body, '',
  ].join('\r\n');
}
