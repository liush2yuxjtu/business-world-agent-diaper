import test from 'node:test';
import assert from 'node:assert/strict';
import { readLiveQuestions, questionSuggestion } from '../lib/business-world/live-questions.ts';

const question = { id:'q1', sessionId:'live-001', at:'2026-09-22T00:00:00.000Z', text:'什么时候发货？', category:'shipping' };
const source = { source:'测试来源',asOf:question.at,mode:'observed',methodology:'隔离测试',items:[question] };
test('questions need traceable unique identities and valid provenance',()=>{
  assert.equal(readLiveQuestions(source,'observed').items[0].text,question.text);
  assert.equal(readLiveQuestions({...source,source:''},'observed'),null);
  assert.equal(readLiveQuestions({...source,items:[question,question]},'observed'),null);
  assert.equal(readLiveQuestions({...source,items:[{...question,sessionId:''}]},'observed'),null);
  assert.equal(readLiveQuestions({...source,items:[{...question,category:'unknown'}]},'observed'),null);
  assert.equal(readLiveQuestions(source,'simulated').mode,'simulated');
});
test('task suggestions retain original question and require evidence before sending',()=>{
  const task=questionSuggestion(question,'task');
  assert.ok(task.includes(question.text));
  assert.ok(task.includes('人工审核'));
  assert.ok(task.includes('不承诺具体发货或送达时间'));
  for(const category of ['product','shipping','size','authenticity','other']){
    const reply=questionSuggestion({...question,category},'reply');
    assert.ok(reply.includes('内部备注，不发送给顾客'));
    assert.ok(reply.includes('先核实'));
  }
});
