import test from 'node:test';
import assert from 'node:assert/strict';
import { scenarioMetrics } from '../lib/business-world/scenario-model.ts';
test('baseline and both presets preserve baseline while computing explicit modeled values',()=>{
  for(const [change,roi,conversion] of [[0,4.32,3.24],[10,4.75,3.56],[-10,3.89,2.92]]) {
    assert.deepEqual(scenarioMetrics(4.32,3.24,change),{baselineRoi:4.32,modeledRoi:roi,baselineConversionRate:3.24,modeledConversionRate:conversion});
  }
});
test('missing metrics stay missing, zero stays zero, invalid changes produce no preview',()=>{
  assert.equal(scenarioMetrics(null,0,10).modeledRoi,null);assert.equal(scenarioMetrics(null,0,10).modeledConversionRate,0);
  for(const value of [NaN,Infinity,-81,201]) assert.equal(scenarioMetrics(4.32,3.24,value),null);
  assert.equal(scenarioMetrics(4.32,null,-80).modeledConversionRate,null);
});
