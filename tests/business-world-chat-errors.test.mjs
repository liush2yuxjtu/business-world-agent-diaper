import test from 'node:test';
import assert from 'node:assert/strict';
import { chatErrorMessage } from '../lib/business-world/chat-errors.ts';
test('chat errors expose only fixed actionable text, never provider URLs or payloads',()=>{
 const inputs=[new Error('AI Gateway requires a valid credit card on file https://vendor.test/private?token=example'),new Error('401 Unauthorized API_KEY=example'),new Error('429 too many requests'),new Error('database stack SELECT private_customer FROM internal'),{message:'secret raw response'}];
 for(const input of inputs){const text=chatErrorMessage(input);assert.doesNotMatch(text,/https?:|token|API_KEY|SELECT|private|stack|database/);assert.ok(text.length>10);}
 assert.match(chatErrorMessage(inputs[0]),/计费配置/);
 assert.match(chatErrorMessage(inputs[1]),/访问权限/);
 assert.match(chatErrorMessage(inputs[2]),/请求较多/);
 assert.match(chatErrorMessage(inputs[3]),/核对实际记录/);
});
