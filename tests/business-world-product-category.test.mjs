import test from 'node:test';
import assert from 'node:assert/strict';
import { productCategory, productCategoryGroups } from '../lib/business-world/product-category.ts';

test('category totals preserve unknown identity and do not guess from a product name', () => {
  const products = [{id:'a',category:' 夜用 ',gmv:30},{id:'b',category:'夜用',gmv:20},{id:'c',name:'纸尿裤',gmv:5},{id:'d',category:'未注明分类',gmv:0}];
  const copy = structuredClone(products);
  assert.deepEqual(productCategoryGroups(products), [{category:'夜用',count:2,gmv:50},{category:null,count:1,gmv:5},{category:'未注明分类',count:1,gmv:0}]);
  assert.equal(productCategory(products[2]),null);
  assert.deepEqual(products,copy);
});
test('zero remains zero, empty is empty, invalid amounts cannot produce a misleading chart', () => {
  assert.deepEqual(productCategoryGroups([]),[]);
  assert.deepEqual(productCategoryGroups([{id:'zero',category:null,gmv:0}]),[{category:null,count:1,gmv:0}]);
  for (const gmv of [-1,NaN,Infinity]) assert.equal(productCategoryGroups([{id:'x',gmv}]),null);
  assert.equal(productCategoryGroups([{id:'a',category:'x',gmv:Number.MAX_VALUE},{id:'b',category:'x',gmv:Number.MAX_VALUE}]),null);
});
