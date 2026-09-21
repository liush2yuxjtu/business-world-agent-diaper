import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex, searchEntries } from '../lib/business-world/search-model.ts';

const snapshot={provenance:{sourceLabel:'验证数据集',asOf:null},data:{meta:{dataMode:'simulated'},personas:[{id:'p1',name:'小雨',title:'护理人群',goal:'夜间防漏',pain:'尺码',content:'护理',trigger:'复购',population:0,conversionRate:0,repeatRate:null}],content:{topTopics:[{title:'A&B 夜间',persona:'护理人群',potential:'待验证'}]},commerce:{products:[]},ads:{campaigns:[]},live:{sessions:[]}}};
test('search finds real entities and encodes exact targets with explicit provenance',()=>{
 const index=buildSearchIndex(snapshot,[['persona','Persona Studio']]);
 const person=searchEntries(index,'小雨 夜间')[0];
 assert.equal(person.id,'persona:p1');
 assert.ok(person.fields.some(([k,v])=>k==='转化率'&&v==='0%'));
 assert.ok(person.fields.some(([k,v])=>k==='复购率'&&v==='未观测'));
 assert.ok(person.fields.some(([k,v])=>k==='观测时间'&&v==='未指定'));
 assert.ok(person.fields.some(([,v])=>v.includes('合成演示')));
 const topic=searchEntries(index,'A&B')[0];
 assert.equal(new URL(topic.href,'https://example.org').searchParams.get('entity'),'topic:A&B 夜间');
 assert.equal(searchEntries(index,'来源')[0].kind,'证据来源');
 assert.equal(searchEntries(index,'ＰＥＲＳＯＮＡ')[0].kind,'页面');
 assert.deepEqual(searchEntries(index,'不存在'),[]);
 assert.deepEqual(searchEntries(index,'  '),[]);
});
test('no source means no fabricated entities; historical scenario keeps exact record ID',()=>{
 const id='00000000-0000-4000-8000-000000000001';
 const index=buildSearchIndex(null,[['overview','总览']],[{id,prompt:'夜间实验',lever:'conversion',changePercent:12,createdAt:'2026-09-21'}]);
 assert.equal(index.length,2);
 const run=searchEntries(index,id)[0];
 assert.equal(new URL(run.href,'https://example.org').searchParams.get('run'),id);
 assert.equal(run.kind,'已保存情景');
});
