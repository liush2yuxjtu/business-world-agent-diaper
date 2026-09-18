import { z } from "zod";
import { verifyChatPassword,getChatPassword,createPasswordSessionToken,PASSWORD_SESSION_COOKIE_NAME,PASSWORD_SESSION_MAX_AGE } from "@/lib/password-auth";
import { boundedJson,privateJson,publicFailure,sameOrigin } from "@/lib/business-world/http";
// Starter-mode login is for one trusted operator. Do not substitute it for per-user OAuth.
let failures=0,windowStart=0;
export async function POST(request:Request){
  if(!sameOrigin(request))return privateJson({error:"请从本站登录页面重新提交。"},403);
  const now=Date.now();if(now-windowStart>60000){windowStart=now;failures=0;}
  if(failures>=10)return privateJson({error:"尝试次数较多，请稍后再试。"},429);
  try{
    if(getChatPassword().length<16)return privateJson({error:"工作区登录暂不可用，请联系管理员。"},503);
    const parsed=z.strictObject({password:z.string().max(512)}).safeParse(await boundedJson(request));
    if(!parsed.success||!verifyChatPassword(parsed.data.password)){failures++;return privateJson({error:"密码不正确，请重试。"},401);}
    const response=privateJson({ok:true});
    response.headers.append("Set-Cookie",`${PASSWORD_SESSION_COOKIE_NAME}=${createPasswordSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${PASSWORD_SESSION_MAX_AGE}${new URL(request.url).protocol==="https:"?"; Secure":""}`);
    return response;
  }catch(error){return publicFailure(error);}
}
export async function DELETE(request:Request){
  if(!sameOrigin(request))return privateJson({error:"请从本站重新操作。"},403);
  const response=privateJson({ok:true});response.headers.append("Set-Cookie",`${PASSWORD_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);return response;
}
