import { readWorkspace, mutateWorkspace } from "@/lib/business-world/workspace-service";
import { authenticatedOwner, boundedJson, privateJson, publicFailure, sameOrigin } from "@/lib/business-world/http";
export async function GET(){try{return privateJson(await readWorkspace(await authenticatedOwner()));}catch(error){return publicFailure(error);}}
export async function POST(request:Request){
  try{const owner=await authenticatedOwner();if(!sameOrigin(request))return privateJson({error:"此请求无法执行，请从当前工作区重新操作。"},403);return privateJson(await mutateWorkspace(owner,await boundedJson(request)));}catch(error){return publicFailure(error);}
}
