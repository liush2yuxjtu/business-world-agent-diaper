import test from 'node:test';
import assert from 'node:assert/strict';
import { localObservationMinute, observationTimeForSave } from '../lib/business-world/source-editor.ts';

test('untouched source time retains sub-minute precision across local display', () => {
  for (const original of ['2026-09-18T05:18:09.198Z', '2026-01-01T23:59:59.999Z', '2026-09-18T13:18:09.198+08:00']) {
    assert.equal(observationTimeForSave(localObservationMinute(original), original), original);
  }
});

test('an explicit changed observation minute is saved and invalid dates fail', () => {
  const selected = '2026-09-19T11:22';
  assert.equal(observationTimeForSave(selected, '2026-09-18T05:18:09.198Z'), new Date(selected).toISOString());
  assert.equal(observationTimeForSave(selected), new Date(selected).toISOString());
  assert.equal(localObservationMinute('not a date'), '');
  assert.throws(() => observationTimeForSave('not a date'));
});
