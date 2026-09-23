import test from 'node:test';
import assert from 'node:assert/strict';
import { stockReview } from '../lib/business-world/product-stock.ts';

test('stock review includes zero and boundary days, retaining identities without changing source records', () => {
  const products = [{id:'zero',name:'zero',stockDays:0},{id:'boundary',name:'boundary',stockDays:7},{id:'above',name:'above',stockDays:7.1}];
  const original = structuredClone(products);
  assert.deepEqual(stockReview(products,7).low.map(p=>p.id),['zero','boundary']);
  assert.deepEqual(stockReview(products,0).low.map(p=>p.id),['zero']);
  assert.deepEqual(products,original);
});
test('invalid stock data is unknown, not zero or safe, and invalid thresholds do not classify', () => {
  const products = [null,undefined,NaN,Infinity,-1].map((stockDays,i)=>({id:String(i),name:String(i),stockDays}));
  const result = stockReview(products,7);
  assert.deepEqual(result.low,[]);
  assert.deepEqual(result.unknown.map(p=>p.id),['0','1','2','3','4']);
  for (const threshold of [-1,366,NaN,Infinity]) assert.equal(stockReview(products,threshold),null);
  assert.deepEqual(stockReview([],7),{low:[],unknown:[]});
});
