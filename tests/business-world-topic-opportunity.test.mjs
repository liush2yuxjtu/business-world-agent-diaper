import test from 'node:test';
import assert from 'node:assert/strict';
import { topicOpportunitySchema, topicOpportunity } from '../lib/business-world/topic-opportunity.ts';
const score={competition:0,opportunity:100,source:'隔离评分样本',methodology:'仅用于界面边界验收的0–100测试分数',asOf:'2026-09-21T00:00:00Z',mode:'inferred'};
test('opportunity coordinates require bounded scores and complete provenance',()=>{
 assert.equal(topicOpportunitySchema.safeParse(score).success,true);
 for(const patch of [{competition:-1},{opportunity:101},{competition:Infinity},{source:' '},{methodology:''},{asOf:'today'},{mode:'estimated'},{opportunity:undefined}]) assert.equal(topicOpportunity({...score,...patch},'observed'),null);
 assert.equal(topicOpportunity(undefined,'observed'),null);
 assert.equal(topicOpportunity({potential:'high'},'observed'),null);
});
test('synthetic snapshots override observed claims without changing the source scores',()=>{
 const original={...score,mode:'observed'};
 assert.equal(topicOpportunity(original,'simulated').mode,'simulated');
 assert.equal(original.mode,'observed');
 assert.equal(topicOpportunity(original,'observed').opportunity,100);
 assert.equal(topicOpportunity(score,'observed').mode,'inferred');
});
