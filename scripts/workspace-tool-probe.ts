/** Integration-test entry point. Invokes the authored tools, not substitute HTTP handlers or an LLM. */
import { randomUUID } from 'node:crypto';
import { passwordEveAuth } from '../lib/eve-auth';
import { BusinessWorldError } from '../lib/business-world/workspace-service';
import snapshot from '../agent/tools/business_world_snapshot';
import scenario from '../agent/tools/business_scenario_experiment';
import save from '../agent/tools/business_world_save_record';
import content from '../agent/tools/business_content_insights';
import live from '../agent/tools/business_live_insights';
import ads from '../agent/tools/business_ad_insights';
import commerce from '../agent/tools/business_commerce_insights';
const registry={snapshot,scenario,save,content,live,ads,commerce};
let input='';for await(const chunk of process.stdin)input+=String(chunk);
try{
 const payload=JSON.parse(input);
 if(!Object.hasOwn(registry,payload.operation))throw new BusinessWorldError('invalid-input');
 const auth=await passwordEveAuth(new Request('http://localhost/',{headers:{cookie:payload.cookie??''}}));
 if(!auth)throw new BusinessWorldError('authentication-required');
 const tool=registry[payload.operation as keyof typeof registry];
 const schema:unknown=tool.inputSchema;
 if(!schema||typeof schema!=="object"||!("parse" in schema)||typeof schema.parse!=="function")throw new BusinessWorldError('invalid-input');
 const parsed=schema.parse(payload.input??{});
 const context={callId:randomUUID(),toolName:payload.operation,session:{id:randomUUID(),auth:{current:auth,initiator:auth},turn:{id:randomUUID()}},abortSignal:new AbortController().signal};
 const execute=tool.execute as unknown as (input:unknown,context:unknown)=>Promise<unknown>;
 process.stdout.write(JSON.stringify(await execute(parsed,context))+'\n');
}catch(error){process.stdout.write(JSON.stringify({error:error instanceof BusinessWorldError?error.code:'tool-failure'})+'\n');process.exitCode=1;}
