import test from 'node:test';
import assert from 'node:assert/strict';
import { personaEvidenceSchema, personaState, personaEvidenceFields } from '../lib/business-world/persona-evidence.ts';

test('inferred audiences require bounded confidence, timestamp and signal provenance',()=>{
  const inferred={state:'inferred',source:'CRM cohort',asOf:'2026-09-21T00:00:00Z',confidence:0,signals:['30-day repeat orders']};
  assert.equal(personaEvidenceSchema.safeParse(inferred).success,true);
  for(const change of [{confidence:101},{confidence:undefined},{signals:[]},{source:' '},{asOf:'yesterday'}]) assert.equal(personaEvidenceSchema.safeParse({...inferred,...change}).success,false);
  const fields=personaEvidenceFields({evidence:inferred},'observed');
  assert.ok(fields.some(([k,v])=>k==='置信度'&&v==='0%'));
  assert.ok(fields.some(([k,v])=>k==='推断信号'&&v==='30-day repeat orders'));
});
test('synthetic mode overrides measured claims and missing evidence never becomes observed',()=>{
  const p={evidence:{state:'observed',source:'CRM',asOf:'2026-09-21T00:00:00Z'}};
  assert.equal(personaState(p,'simulated'),'simulated');
  assert.equal(personaState({},'observed'),'unverified');
  assert.equal(personaState(p,'observed'),'observed');
  assert.equal(personaState({evidence:{state:'template',source:'Research template'}},'observed'),'template');
  assert.ok(!personaEvidenceFields(p,'simulated').some(([k])=>k==='人群来源'));
});
