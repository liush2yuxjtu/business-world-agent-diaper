import test from 'node:test';
import assert from 'node:assert/strict';
import { presentSnapshot } from '../lib/business-world/presentation.ts';

const seeded = {
  provenance: { sourceMode: 'simulated', provider: 'simulated', sourceLabel: 'Supabase simulated PR9 complete demo dataset' },
  data: { meta: { datasetVersion: 'business-world-diaper-pr9-v2' }, notes: 'PR #9 design-complete synthetic dataset. All values are simulated and stored in Supabase so every current product surface can read from one persisted state.' },
};
test('owned seed metadata receives product labels without mutating the source', () => {
  const output = presentSnapshot(seeded);
  assert.equal(output.provenance.sourceLabel, '纸尿裤经营演示数据');
  assert.equal(output.provenance.provider, '合成演示数据');
  assert.ok(!output.data.notes.includes('PR #9'));
  assert.equal(seeded.provenance.sourceLabel, 'Supabase simulated PR9 complete demo dataset');
  assert.equal(output.provenance.sourceMode, 'simulated');
});
test('custom names, user notes and unrelated sources are retained', () => {
  const custom = { ...seeded, provenance: { ...seeded.provenance, sourceLabel: '秋季经营假设' }, data: { ...seeded.data, notes: '用户记录：保留 PR #9 引用' } };
  assert.equal(presentSnapshot(custom).data.notes, custom.data.notes);
  assert.equal(presentSnapshot(custom).provenance.sourceLabel, custom.provenance.sourceLabel);
  const observed = { ...seeded, provenance: { ...seeded.provenance, sourceMode: 'persisted-observation' } };
  assert.equal(presentSnapshot(observed), observed);
  assert.equal(presentSnapshot({ ...seeded, data: null }).data, null);
});
