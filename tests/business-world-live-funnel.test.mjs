import test from 'node:test';
import assert from 'node:assert/strict';
import { liveFunnelSchema, readLiveFunnel, stageLeakage } from '../lib/business-world/live-funnel.ts';
const sample={source:'隔离测试样本',asOf:'2026-09-21T00:00:00Z',period:'测试周期',cohort:'同一组1000个虚构测试用户',methodology:'按曝光、进房、停留30秒、点击、加购、支付递进去重，支付以人数计',unit:'unique_people',mode:'observed',counts:{exposure:1000,entry:400,retained:200,productClick:100,cart:40,paid:20}};
test('leakage requires comparable adjacent unique-person counts and preserves source data',()=>{
  const before=JSON.stringify(sample);
  assert.deepEqual(stageLeakage(readLiveFunnel(sample,'observed'),'entry'),{before:1000,after:400,lost:600,conversion:40,lossRate:60});
  assert.deepEqual(stageLeakage(readLiveFunnel(sample,'observed'),'paid'),{before:40,after:20,lost:20,conversion:50,lossRate:50});
  assert.equal(stageLeakage(readLiveFunnel(sample,'observed'),'exposure'),null);
  assert.equal(readLiveFunnel(sample,'simulated').mode,'simulated');
  assert.equal(JSON.stringify(sample),before);
});
test('orders, missing provenance, increasing cohorts and unsafe counts cannot become funnel evidence',()=>{
  for(const patch of [{unit:'orders'},{source:''},{cohort:' '},{methodology:''},{asOf:'today'},{counts:{...sample.counts,cart:500}},{counts:{...sample.counts,paid:-1}},{counts:{...sample.counts,entry:1.5}},{counts:{...sample.counts,exposure:1e20}}])assert.equal(liveFunnelSchema.safeParse({...sample,...patch}).success,false);
  assert.equal(readLiveFunnel({exposureUv:1000,watchUv:400,paidOrders:20},'observed'),null);
  assert.equal(readLiveFunnel(undefined,'observed'),null);
});
test('missing intermediate stages and zero denominators do not fabricate percentages',()=>{
  const partial=readLiveFunnel({...sample,counts:{...sample.counts,cart:null}},'observed');
  assert.equal(stageLeakage(partial,'paid'),null);
  const zero=readLiveFunnel({...sample,counts:{exposure:0,entry:0,retained:0,productClick:0,cart:0,paid:0}},'observed');
  assert.equal(stageLeakage(zero,'entry'),null);
  assert.equal(readLiveFunnel({...sample,counts:{...sample.counts,retained:null,productClick:600}},'observed'),null);
});
