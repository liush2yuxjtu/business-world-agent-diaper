import { z } from "zod";
import { BusinessWorldError, mutateWorkspace, readWorkspace, type WorkspaceEnvelope } from "./workspace-service";

function payload(workspace:WorkspaceEnvelope){
  const s=workspace.state.snapshot;
  if(!s)return null;
  const m=s.metrics;
  // Counts are not rates. Uncollected dimensions stay null rather than using demo values.
  return {content:{engagementCount:m.engagement,engagementRate:null,weeklyOpportunities:null},live:{views:m.live,roomEntryRate:null,cartRate:null},commerce:{gmv:m.gmv,conversionRate:m.conversion,repeatRate:m.repeat,revenue:m.revenue,newCustomers:null},ads:{roi:m.roi,budget:null,cpa:null},notes:s.notes};
}
function provenance(workspace:WorkspaceEnvelope){
  const s=workspace.state.snapshot;
  return {sourceMode:s?"manual-unverified":"unavailable",provider:s?"manual-entry":"none",sourceLabel:s?.name??"尚未添加经营记录",stateId:s?.id??null,workspaceId:workspace.workspaceId,revision:workspace.revision,asOf:null,recordedAt:s?.updatedAt??null,updatedAt:workspace.updatedAt,storage:"shared-persistent-workspace",writable:true};
}
export async function getBusinessWorldSnapshot(owner:string){
  const workspace=await readWorkspace(owner);
  return {provenance:provenance(workspace),data:payload(workspace),workspace};
}
export async function getBusinessWorldState(owner:string){
  const workspace=await readWorkspace(owner),s=workspace.state.snapshot;
  return s?{id:s.id,sourceLabel:s.name,sourceType:"manual-entry" as const,observedAt:null,updatedAt:s.updatedAt,payload:payload(workspace),revision:workspace.revision}:null;
}
export async function getContentInsights(_input:unknown,owner:string){const w=await readWorkspace(owner);return {provenance:provenance(w),data:payload(w)?.content??null};}
export async function getLiveInsights(_input:unknown,owner:string){const w=await readWorkspace(owner);return {provenance:provenance(w),data:payload(w)?.live??null};}
export async function getAdInsights(_input:unknown,owner:string){const w=await readWorkspace(owner);return {provenance:provenance(w),data:payload(w)?.ads??null};}
export async function getCommerceInsights(_input:unknown,owner:string){const w=await readWorkspace(owner);return {provenance:provenance(w),data:payload(w)?.commerce??null};}

export const businessWorldPayloadSchema=z.strictObject({
 content:z.strictObject({engagementCount:z.number().int().nonnegative()}),
 live:z.strictObject({views:z.number().int().nonnegative()}),
 commerce:z.strictObject({gmv:z.number().nonnegative(),conversionRate:z.number().min(0).max(100),repeatRate:z.number().min(0).max(100),revenue:z.number().nonnegative()}),
 ads:z.strictObject({roi:z.number().nonnegative()}),notes:z.string().max(2000).default("")
});
export type BusinessWorldPayload=z.infer<typeof businessWorldPayloadSchema>;
export const businessWorldWriteSchema=z.strictObject({expectedRevision:z.number().int().nonnegative(),sourceLabel:z.string().trim().min(1).max(120),sourceType:z.literal("manual-entry"),payload:businessWorldPayloadSchema});
export async function saveBusinessWorldState(input:unknown,owner:string){
 const parsed=businessWorldWriteSchema.safeParse(input);if(!parsed.success)throw new BusinessWorldError("invalid-input");
 const {expectedRevision,sourceLabel,payload:p}=parsed.data;
 const workspace=await mutateWorkspace(owner,{expectedRevision,command:{kind:"save-snapshot",name:sourceLabel,notes:p.notes,metrics:{gmv:p.commerce.gmv,conversion:p.commerce.conversionRate,roi:p.ads.roi,repeat:p.commerce.repeatRate,revenue:p.commerce.revenue,engagement:p.content.engagementCount,live:p.live.views}}});
 return {provenance:provenance(workspace),data:payload(workspace),workspace};
}
export const scenarioInputSchema=z.strictObject({prompt:z.string().trim().min(1).max(500),lever:z.enum(["content_engagement","ad_efficiency","checkout_conversion","repeat_purchase"]),changePercent:z.number().finite().min(-95).max(100),expectedRevision:z.number().int().nonnegative()});
export async function runScenarioExperiment(input:unknown,owner:string){
 const parsed=scenarioInputSchema.safeParse(input);if(!parsed.success)throw new BusinessWorldError("invalid-input");
 const {prompt,lever,changePercent,expectedRevision}=parsed.data;
 const workspace=await mutateWorkspace(owner,{expectedRevision,command:{kind:"run-scenario",prompt,lever,change:changePercent}});
 const run=workspace.state.scenarios[0];
 return {id:run.id,provenance:provenance(workspace),result:{modeled:true,baselineId:run.baseline.id,baseline:run.baseline.metrics,modeledMetrics:run.modeled,baselineRoi:run.baseline.metrics.roi,modeledRoi:run.modeled.roi,baselineConversionRate:run.baseline.metrics.conversion,modeledConversionRate:run.modeled.conversion,assumptions:run.assumptions,modelVersion:run.modelVersion,warning:"情景估算来自明确的假设，不是已观测结果或销量预测。"},workspace};
}
