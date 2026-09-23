import test from 'node:test';
import assert from 'node:assert/strict';
import { composeScenarioReport, reportText } from '../lib/business-world/report-model.ts';
import { reportSections } from '../lib/business-world/report-content.ts';
import { composeReportEmail } from '../lib/business-world/report-email.ts';

function fixture() {
  return {
    baseline: { meta: { dataMode: 'simulated' }, ads: { roi: 2 }, commerce: { conversionRate: 3, gmv: 700, products: [] }, content: { engagementRate: 4 }, live: { paidOrders: 5 }, report: { period: '历史周期', summary: '历史摘要', sections: ['风险'] } },
    scenario: { id: 'saved-run', prompt: '投放效率提升10%', lever: 'ad_efficiency', changePercent: 10, createdAt: '2026-09-18T00:00:00Z', result: { baselineRoi: 2, modeledRoi: 2.2, baselineConversionRate: 3, modeledConversionRate: 3.3 } },
  };
}
const identity = { id: 'saved-report', title: '历史情景报告', audience: '管理层' };
test('scenario report freezes the historical baseline separately from modeled values in every export', () => {
  const { baseline, scenario } = fixture();
  const report = composeScenarioReport(baseline, scenario, identity, '2026-09-21T00:00:00Z');
  baseline.ads.roi = 90; scenario.result.modeledRoi = 99;
  assert.equal(report.snapshot.data.ads.roi, 2);
  assert.equal(report.scenario.result.modeledRoi, 2.2);
  assert.equal(report.snapshot.provenance.asOf, null);
  assert.match(report.generatedSummary, /ROI：2/);
  for (const text of [reportText(report), reportSections(report).map(x => x.text).join('\n'), composeReportEmail(report).body]) {
    assert.match(text, /基线 ROI：2 → 推演 ROI：2.2/);
    assert.match(text, /saved-run/);
    assert.match(text, /不代表真实经营结果/);
    assert.doesNotMatch(text, /90|99/);
  }
});
test('conflicting baseline metrics fail instead of silently substituting current state', () => {
  const { baseline, scenario } = fixture();
  assert.throws(() => composeScenarioReport({ ...baseline, ads: { roi: 8 } }, scenario, identity, 'now'));
  assert.throws(() => composeScenarioReport({ ...baseline, commerce: { ...baseline.commerce, conversionRate: 9 } }, scenario, identity, 'now'));
});
