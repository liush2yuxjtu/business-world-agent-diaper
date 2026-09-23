import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarWeek, shiftCalendarWeek } from '../lib/business-world/content-calendar.ts';
import { composeManualTopic, composeContentPlan, createDraftInput } from '../lib/business-world/content-draft-model.ts';

test('calendar week stays Monday to Sunday across year and leap-day boundaries',()=>{
 assert.deepEqual(calendarWeek('2026-01-01'),['2025-12-29','2025-12-30','2025-12-31','2026-01-01','2026-01-02','2026-01-03','2026-01-04']);
 assert.equal(calendarWeek('2028-02-29')[1],'2028-02-29');
 assert.equal(shiftCalendarWeek('2026-01-01',1),'2026-01-05');
 assert.equal(shiftCalendarWeek('2026-01-01',-1),'2025-12-22');
 for(const bad of ['2026-02-30','2026-13-01','junk',''])assert.deepEqual(calendarWeek(bad),[]);
});
test('manual topic remains an unverified authored brief and plan copies preserve its origin',()=>{
 const topic=composeManualTopic({title:' 用户选题 ',body:'独立撰写的研究问题',audience:'目标人群假设'},'id','now');
 assert.equal(topic.kind,'brief');assert.equal(topic.title,'用户选题');assert.equal(topic.body,'独立撰写的研究问题');assert.equal(topic.origin,'manual-topic');
 assert.equal(topic.source.asOf,null);assert.equal(topic.source.dataMode,'simulated');assert.match(topic.source.sourceLabel,/尚待验证/);
 assert.equal(topic.scheduledFor,undefined);
 const plan=composeContentPlan(topic,{id:'plan',scheduledFor:'2026-09-26',channel:'仅验收未发布'},'later');
 topic.body='修改原文';assert.equal(plan.body,'独立撰写的研究问题');assert.equal(plan.origin,'manual-topic');
 for(const input of [{title:' ',body:'x',audience:'x'},{title:'x',body:' ',audience:'x'},{title:'x',body:'x',audience:''}])assert.equal(createDraftInput.safeParse({kind:'new-topic',...input}).success,false);
 assert.equal(createDraftInput.safeParse({kind:'new-topic',title:'x',body:'x',audience:'x',scheduledFor:'2026-09-26'}).success,false);
});
