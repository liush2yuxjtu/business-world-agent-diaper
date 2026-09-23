import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarioEntity } from '../lib/business-world/scenario-context.ts';
import { runSchema } from '../lib/business-world/scenario-client.ts';
import { scenarioReportText } from '../lib/business-world/report-model.ts';
const baseline = {personas:[{id:'p',title:'人群'}],content:{topTopics:[{title:'内容:夜间 & 尺码'}]},live:{sessions:[{id:'s',title:'直播'}]},ads:{campaigns:[{id:'a',name:'广告'}]},commerce:{products:[{id:'p',name:'商品'}]}};
test('entity context uses typed identity from baseline and rejects stale or invented entities',()=>{
  const before=JSON.stringify(baseline);
  for(const [id,label,lever] of [['persona:p','人群','repeat_purchase'],['topic:内容:夜间 & 尺码','内容:夜间 & 尺码','content_engagement'],['session:s','直播','live_watch_time'],['campaign:a','广告','ad_efficiency'],['product:p','商品','checkout_conversion']]) assert.deepEqual(scenarioEntity(baseline,id),{id,label,lever});
  assert.equal(scenarioEntity(baseline,'product:missing'),null);
  assert.equal(scenarioEntity(null,'product:p'),null);
  assert.equal(JSON.stringify(baseline),before);
});
test('persisted scenario context survives client parsing and report export without substituting current source',()=>{
  const raw={id:'a0876a2b-9bc7-402b-a597-c79046aa5e34',prompt:'场景',lever:'checkout_conversion',changePercent:-10,createdAt:'2026-09-21T00:00:00Z',result:{assumption:'-10%',baselineRoi:2,modeledRoi:1.8,baselineConversionRate:3,modeledConversionRate:2.7,context:{entity:{id:'product:p',label:'保存的商品',lever:'checkout_conversion'},baseline:{stateId:'saved-state',datasetVersion:'v1',sourceLabel:'保存的来源',observedAt:'2026-09-01T00:00:00Z',dataMode:'simulated'}}}};
  const parsed=runSchema.parse(raw);assert.deepEqual(parsed.result.context,raw.result.context);
  const text=scenarioReportText(parsed);assert.match(text,/保存的商品/);assert.match(text,/saved-state/);assert.match(text,/2026-09-01/);assert.doesNotMatch(text,/未保存来源观测时间/);
  delete raw.result.context;assert.match(scenarioReportText(runSchema.parse(raw)),/未保存来源观测时间/);
});
