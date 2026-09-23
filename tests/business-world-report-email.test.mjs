import test from 'node:test';
import assert from 'node:assert/strict';
import { composeReportEmail, reportEmailFile } from '../lib/business-world/report-email.ts';

test('email keeps saved report provenance, independent note and revision', () => {
  const report = { id: 'history-report', revision: 7, title: '历史报告', audience: '管理层', period: '历史周期', createdAt: '2026-09-21', generatedSummary: '合成数据演示', humanNote: '独立人工备注', snapshot: { provenance: { sourceLabel: '历史来源', asOf: '2026-09-18' }, data: { report: { sections: ['风险与机会'] } } } };
  const original = structuredClone(report);
  const draft = composeReportEmail(report);
  assert.equal(draft.recipient, '');
  for (const text of ['历史来源', '独立人工备注', '报告版本：7', '合成数据演示']) assert.ok(draft.body.includes(text));
  draft.body = '人工修改邮件';
  assert.deepEqual(report, original);
});

test('mail headers reject injection and MIME preserves long Unicode text', () => {
  const draft = { recipient: 'review@example.com', subject: '中文👶主题'.repeat(20), body: '完整中文正文\nBcc: 这行只是正文\n'.repeat(200) };
  const eml = reportEmailFile(draft);
  const [headers, ...body] = eml.split('\r\n\r\n');
  assert.match(headers, /X-Unsent: 1/);
  assert.equal(Buffer.from(body.join('\r\n\r\n').replace(/\s/g, ''), 'base64').toString('utf8'), draft.body.replace(/\n/g, '\r\n'));
  const subject = [...headers.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)].map(m => Buffer.from(m[1], 'base64').toString('utf8')).join('');
  assert.equal(subject, draft.subject);
  for (const recipient of ['a@example.com\r\nBcc: bad@example.com', 'a@example.com,b@example.com', 'bad', 'a@-example.com']) assert.throws(() => reportEmailFile({ ...draft, recipient }));
  assert.throws(() => reportEmailFile({ ...draft, subject: '标题\nBcc: bad@example.com' }));
});
