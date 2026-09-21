import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignBudgetGroups, budgetSlicePath } from '../lib/business-world/campaign-budget.ts';

test('budget shares aggregate duplicate channels from activity budgets without modifying source', () => {
  const rows = [{ channel: '搜索', budget: 30 }, { channel: '搜索', budget: 20 }, { channel: '千川', budget: 150 }, { channel: '零预算', budget: 0 }];
  const before = JSON.stringify(rows);
  assert.deepEqual(campaignBudgetGroups(rows), { total: 200, groups: [
    { channel: '搜索', budget: 50, count: 2, share: .25 },
    { channel: '千川', budget: 150, count: 1, share: .75 },
    { channel: '零预算', budget: 0, count: 1, share: 0 },
  ] });
  assert.equal(JSON.stringify(rows), before);
});
test('empty, zero and invalid budgets never create fabricated shares or invalid geometry', () => {
  assert.deepEqual(campaignBudgetGroups([]), { total: 0, groups: [] });
  assert.equal(campaignBudgetGroups([{ channel: '', budget: 0 }]).groups[0].share, 0);
  for (const budget of [-1, NaN, Infinity]) assert.equal(campaignBudgetGroups([{ channel: 'x', budget }]), null);
  assert.equal(campaignBudgetGroups([{ channel: 'x', budget: Number.MAX_VALUE }, { channel: 'x', budget: Number.MAX_VALUE }]), null);
  assert.equal(budgetSlicePath(0, 0), '');
  assert.equal((budgetSlicePath(0, 1).match(/A86/g) ?? []).length, 2);
  assert.ok(!budgetSlicePath(.25, .75).includes('NaN'));
});
