import { getServerViewer } from "@/lib/session";
import { BusinessWorldError, workspaceOwner } from "./workspace-service";
export async function authenticatedOwner(){const viewer=await getServerViewer();if(!viewer)throw new BusinessWorldError("authentication-required");return workspaceOwner(viewer.id);}
export function privateJson(value:unknown,status=200){return Response.json(value,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"}});}
export function publicFailure(error:unknown){
  const safe=error instanceof BusinessWorldError?error:new BusinessWorldError("unavailable");
  const status=({"authentication-required":401,unavailable:503,conflict:409,"invalid-input":400,"baseline-required":400,"not-found":404})[safe.code];
  return privateJson({error:safe.message},status);
}
export function sameOrigin(request:Request){
  try{
    const supplied=request.headers.get("origin"),source=new URL(supplied??"");
    if(supplied!==source.origin||!["http:","https:"].includes(source.protocol))return false;
    const configured=process.env.BUSINESS_WORLD_PUBLIC_ORIGIN?.trim();
    if(configured)return source.origin===new URL(configured).origin;
    // Next may construct request.url with its internal listening hostname. Compare
    // the browser Origin to the incoming Host, not that internal hostname.
    const host=request.headers.get("host");
    const protocol=process.env.VERCEL==="1"?request.headers.get("x-forwarded-proto")??new URL(request.url).protocol.slice(0,-1):new URL(request.url).protocol.slice(0,-1);
    return source.host===host&&source.protocol===protocol+":";
  }catch{return false;}
}
export async function boundedJson(request:Request):Promise<unknown>{
  if(!request.headers.get("content-type")?.startsWith("application/json"))throw new BusinessWorldError("invalid-input");
  const reader=request.body?.getReader();if(!reader)throw new BusinessWorldError("invalid-input");
  const chunks:Uint8Array[]=[];let size=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw new BusinessWorldError("invalid-input");}chunks.push(value);}
    const bytes=new Uint8Array(size);let position=0;for(const chunk of chunks){bytes.set(chunk,position);position+=chunk.length;}
    return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
  }catch{throw new BusinessWorldError("invalid-input");}finally{reader.releaseLock();}
}
