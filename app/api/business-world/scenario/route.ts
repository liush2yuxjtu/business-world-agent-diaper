import { runScenarioExperiment } from "@/lib/business-world/real-service";
import { authenticatedOwner, boundedJson, privateJson, publicFailure, sameOrigin } from "@/lib/business-world/http";
export async function POST(request:Request){
  try{const owner=await authenticatedOwner();if(!sameOrigin(request))return privateJson({error:"此请求无法执行，请从当前工作区重新操作。"},403);return privateJson(await runScenarioExperiment(await boundedJson(request),owner));}catch(error){return publicFailure(error);}
}
