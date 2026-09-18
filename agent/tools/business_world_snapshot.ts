import { defineTool } from "eve/tools";
import { z } from "zod";
import { getBusinessWorldSnapshot } from "@/lib/business-world/real-service";
import { toolOwner } from "@/lib/business-world/tool-auth";
export default defineTool({description:"读取当前账户与经营工作台共用的持久化经营记录、情景及报告。人工录入始终未核验；缺少的维度返回空值。包含当前 revision 供后续更新检测冲突。",inputSchema:z.strictObject({}),async execute(_input,ctx){return getBusinessWorldSnapshot(toolOwner(ctx));}});
