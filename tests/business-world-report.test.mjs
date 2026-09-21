import test from 'node:test';
import assert from 'node:assert/strict';
import { composeReport, reportText } from '../lib/business-world/report-model.ts';

function snapshot() {
  return { provenance: { sourceLabel: '测试合成数据', asOf: '2026-09-17T06:00:00Z' }, data: {
    meta: { dataMode: 'simulated' }, commerce: { gmv: 0 }, ads: { roi: null },
    content: { engagementRate: 0 }, live: { paidOrders: null },
    report: { period: '测试周期', summary: '基线摘要', sections: ['来源证据'] },
  } };
}
test('report freezes source data and distinguishes zero from missing metrics', () => {
  const source = snapshot();
  const report = composeReport(source, { id: 'report-a', title: '测试报告', audience: '管理层' }, '2026-09-21T00:00:00Z');
  source.data.commerce.gmv = 500;
  source.data.report.summary = '更晚的摘要';
  assert.equal(report.snapshot.data.commerce.gmv, 0);
  assert.match(report.generatedSummary, /GMV：0 元/);
  assert.match(report.generatedSummary, /ROI：暂无数据/);
  assert.match(report.generatedSummary, /合成数据演示/);
  assert.match(report.generatedSummary, /基线摘要/);
});
test('human notes remain separate and exports use the selected saved report', () => {
  const report = composeReport(snapshot(), { id: 'report-a', title: '报告甲', audience: '管理层' }, '2026-09-21T00:00:00Z');
  const summary = report.generatedSummary;
  report.humanNote = '人工核对：暂不扩大投放';
  const exported = reportText(report);
  assert.equal(report.generatedSummary, summary);
  assert.match(exported, /报告甲/);
  assert.match(exported, /人工备注\n\n人工核对：暂不扩大投放/);
  assert.match(exported, /来源：测试合成数据/);
});
test('no report is fabricated when there is no baseline', () => {
  assert.throws(() => composeReport({ data: null }, { id: 'report-a', title: '标题', audience: '管理层' }, '2026-09-21T00:00:00Z'));
});
