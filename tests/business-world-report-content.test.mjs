import test from 'node:test';
import assert from 'node:assert/strict';
import { reportSections, wrapReportText } from '../lib/business-world/report-content.ts';

test('both export formats receive the selected saved source and independent note', () => {
  const selected = {
    title: '已选历史报告', audience: '管理层', period: '历史周期', createdAt: '2026-09-21T00:00:00Z',
    generatedSummary: '历史摘要', humanNote: '人工备注，保留<script>为文本',
    snapshot: { provenance: { sourceLabel: '历史来源', asOf: '2026-09-17T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z' },
      data: { meta: { dataMode: 'simulated' }, commerce: { gmv: 0, products: [] }, ads: { roi: null }, content: { engagementRate: 0 }, live: { paidOrders: null }, report: { sections: ['第一项', '第二项'] } } },
  };
  const before = structuredClone(selected);
  const sections = reportSections(selected);
  assert.match(sections[0].text, /已选历史报告/);
  assert.match(sections[0].text, /合成数据演示/);
  assert.equal(sections.find(s => s.heading === '人工备注').text, selected.humanNote);
  assert.match(sections.find(s => s.heading === '经营基线').text, /GMV：0 元/);
  assert.match(sections.find(s => s.heading === '经营基线').text, /ROI：暂无数据/);
  assert.match(sections.find(s => s.heading === '来源与适用边界').text, /历史来源/);
  assert.deepEqual(selected, before);
});
test('long notes are wrapped without dropping characters or splitting Unicode code points', () => {
  const note = '完整保留中文与英文ABC123。'.repeat(230) + '末尾验收标记';
  const lines = wrapReportText(note, 44, s => Array.from(s).length);
  assert.equal(lines.join(''), note);
  assert.ok(lines.every(line => Array.from(line).length <= 44));
  assert.ok(lines.length > 12);
  assert.deepEqual(wrapReportText('甲👶乙\n\n丙', 2, s => Array.from(s).length), ['甲👶', '乙', '', '丙']);
});
