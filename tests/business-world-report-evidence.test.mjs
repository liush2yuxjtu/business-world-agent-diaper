import test from 'node:test';
import assert from 'node:assert/strict';
import { reportEvidence, reportSectionTarget } from '../lib/business-world/report-evidence.ts';

const saved={provenance:{sourceLabel:'历史来源A',asOf:'2026-09-17T00:00:00Z',updatedAt:null},data:{meta:{dataMode:'simulated',datasetVersion:'historical-v1'},personas:[],content:{engagementRate:0,topTopics:[]},commerce:{gmv:0,products:[{id:'p1',name:'历史商品',size:'M',price:25,gmv:0,conversionRate:null,stockDays:7,refundRate:0}]},ads:{roi:2,campaigns:[]},live:{paidOrders:0,sessions:[]},report:{period:'历史周期'}}};
test('report evidence reads historical entities and metrics without a current-state fallback',()=>{
  const before=JSON.stringify(saved),current=structuredClone(saved);
  current.data.commerce.gmv=999999;current.data.commerce.products[0].name='当前商品';current.provenance.sourceLabel='当前来源B';
  const evidence=reportEvidence(saved,'product');
  assert.equal(evidence.metrics.find(([k])=>k==='商品 GMV')[1],'0 元');
  assert.equal(evidence.entities[0].label,'历史商品');
  assert.equal(evidence.source.find(([k])=>k==='来源')[1],'历史来源A');
  assert.equal(evidence.source.find(([k])=>k==='版本')[1],'historical-v1');
  assert.equal(evidence.currentPageHref,'?screen=product');
  assert.match(evidence.entities[0].fields.find(([k])=>k==='情景归属')[1],/本报告.*固定基线/);
  assert.equal(JSON.stringify(saved),before);
  assert.ok(!JSON.stringify(evidence).includes('999999'));
});
test('missing sources and empty entity lists stay missing instead of being filled from other sections',()=>{
  assert.equal(reportEvidence(null,'overview'),null);
  const evidence=reportEvidence(saved,'live');
  assert.deepEqual(evidence.entities,[]);
  assert.equal(evidence.metrics.find(([k])=>k==='观看人数')[1],'未提供');
  assert.equal(evidence.metrics.find(([k])=>k==='支付订单')[1],'0 单');
  assert.equal(evidence.source.find(([k])=>k==='来源更新时间')[1],'未指定');
  assert.match(evidence.source[0][1],/合成演示/);
});
test('canonical report headings route to their evidence without guessing custom narrative attribution',()=>{
  assert.equal(reportSectionTarget('直播复盘'),'live');
  assert.equal(reportSectionTarget('商品建议'),'product');
  assert.equal(reportSectionTarget('直播带动商品增长42%'),'overview');
});
