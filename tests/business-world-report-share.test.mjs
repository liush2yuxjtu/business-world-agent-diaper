import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedReportSnapshot, shareCreateInput, shareReadInput } from '../lib/business-world/report-share-model.ts';

test('shared snapshot keeps report content but excludes ownership, token and unrelated source fields', () => {
  const report = { id: 'report', title: '合成报告', revision: 2, audience: '管理层', period: '本周', createdAt: '2026-09-21', generatedSummary: '演示摘要', humanNote: '人工备注', owner_hash: 'never-publish', token_hash: 'never-publish', snapshot: { provenance: { sourceLabel: '合成数据', asOf: null, updatedAt: null }, data: { meta: { dataMode: 'simulated' }, ads: { roi: 4 }, content: { engagementRate: null }, live: { paidOrders: null }, commerce: { gmv: 5, products: [] }, report: { sections: ['结论'] }, unrelatedPrivateField: 'never-publish' } } };
  const shared = sharedReportSnapshot(report);
  report.humanNote = '后续修改'; report.snapshot.data.ads.roi = 99;
  const text = JSON.stringify(shared);
  assert.match(text, /人工备注/); assert.match(text, /合成数据演示/);
  assert.doesNotMatch(text, /never-publish|owner_hash|token_hash|unrelatedPrivateField|后续修改/);
  assert.equal(shared.revision, 2);
});
test('share input requires exact report revision and a full capability token', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.ok(shareCreateInput.safeParse({ reportId: id, revision: 2 }).success);
  for (const input of [{ reportId: id }, { reportId: id, revision: 0 }, { reportId: id, revision: 1, document: {} }]) assert.equal(shareCreateInput.safeParse(input).success, false);
  assert.ok(shareReadInput.safeParse({ id, token: 'a'.repeat(64) }).success);
  for (const token of ['', 'a'.repeat(63), 'z'.repeat(64)]) assert.equal(shareReadInput.safeParse({ id, token }).success, false);
});
