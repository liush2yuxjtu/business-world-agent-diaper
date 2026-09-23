import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignRiskGroups } from '../lib/business-world/campaign-risk.ts';
const row = (id, budget, spend) => ({ id, name: id, channel: '测试', budget, spend });

test('budget differences retain exact affected identities without modifying the source or claiming attribution', () => {
  const rows = [row('over', 100, 125), row('equal', 100, 100), row('under', 100, 50), row('zero', 0, 20)];
  const before = structuredClone(rows);
  const result = campaignRiskGroups(rows);
  assert.deepEqual(result.difference.map(r => [r.campaign.id,r.excess,r.percent]), [['over',25,25],['zero',20,null]]);
  assert.deepEqual(result.invalid, []);
  assert.deepEqual(rows, before);
});
test('missing or invalid amounts are unknown rather than zero, safe, or overspent', () => {
  const rows = [row('missing', null, 100),row('bad', 100, NaN),row('negative',-1,2),row('infinite',2,Infinity)];
  const result=campaignRiskGroups(rows);
  assert.deepEqual(result.invalid.map(r=>r.campaign.id), rows.map(r=>r.id));
  assert.deepEqual(result.difference, []);
  assert.deepEqual(campaignRiskGroups([]), { difference: [], invalid: [] });
  assert.equal(campaignRiskGroups([row('tiny',Number.MIN_VALUE,Number.MAX_VALUE)]).difference[0].percent,null);
});
