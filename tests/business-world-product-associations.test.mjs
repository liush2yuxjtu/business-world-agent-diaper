import test from 'node:test';
import assert from 'node:assert/strict';
import { readProductAssociations, associationProduct } from '../lib/business-world/product-associations.ts';
const row={id:'a',title:'组合',productIds:['one','two'],jointOrders:20,hypothesis:'研究假设'};
const source={source:'隔离样本',asOf:'2026-09-22T00:00:00Z',period:'测试周期',methodology:'同单去重',mode:'observed',sampleOrders:100,rows:[row]};
test('association counts require a valid denominator and unique members',()=>{
 assert.equal(readProductAssociations(source,'observed').rows[0].jointOrders,20);
 for(const change of [{sampleOrders:0},{rows:[{...row,jointOrders:101}]},{rows:[{...row,productIds:['one','one']}]},{rows:[row,row]},{source:''}]) assert.equal(readProductAssociations({...source,...change},'observed'),null);
 assert.equal(readProductAssociations(source,'simulated').mode,'simulated');
});
test('missing or ambiguous product identities cannot supply a price',()=>{
 assert.equal(associationProduct([{id:'one',price:10}], 'one').price,10);
 assert.equal(associationProduct([{id:'one',price:10}], 'missing'),null);
 assert.equal(associationProduct([{id:'one',price:10},{id:'one',price:20}], 'one'),null);
});
