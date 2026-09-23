import test from 'node:test';
import assert from 'node:assert/strict';
import { readLiveAudience, audiencePersona } from '../lib/business-world/live-audience.ts';

const sample = {source:'演示',asOf:'2026-09-22T00:00:00.000Z',period:'独立样本',methodology:'按标识分段，组内去重，组间不汇总',mode:'observed',segments:[{personaId:'a',viewers:0}]};
test('audience evidence preserves zero and simulation overrides observed claims without mutation',()=>{
  const input=structuredClone(sample); const result=readLiveAudience(input,'simulated');
  assert.equal(result.mode,'simulated');assert.equal(result.segments[0].viewers,0);assert.deepEqual(input,sample);
  for(const broken of [{...sample,source:''},{...sample,segments:[...sample.segments,...sample.segments]},{...sample,segments:[{personaId:'a',viewers:1.5}]}])assert.equal(readLiveAudience(broken,'observed'),null);
});
test('only unique explicit persona identities resolve; missing or duplicate IDs do not select a fallback',()=>{
  const person={id:'a',title:'新手家庭'};
  assert.equal(audiencePersona([person],'a'),person);
  assert.equal(audiencePersona([person],'新手家庭'),null);
  assert.equal(audiencePersona([person],'missing'),null);
  assert.equal(audiencePersona([person,{...person}],'a'),null);
});
