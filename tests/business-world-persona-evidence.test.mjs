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

test('metric provenance follows each persona rather than the containing observed snapshot',()=>{
 for(const [state,expected] of [['template','模板假设值'],['inferred','不等于直接观测'],['simulated','非客户观测']]) {
  const fields=personaEvidenceFields({evidence:{state,source:'Fixture',confidence:72,signals:['fixture'],asOf:'2026-09-20T00:00:00Z'}},'observed');
  assert.ok(fields.some(([k,v])=>k==='指标口径'&&v.includes(expected)));
 }
 assert.ok(personaEvidenceFields({},'observed').some(([k,v])=>k==='指标口径'&&v.includes('尚待核验')));
});
