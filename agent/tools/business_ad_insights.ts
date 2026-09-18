import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAdInsights } from "@/lib/business-world/real-service";
import { toolOwner } from "@/lib/business-world/tool-auth";
export default defineTool({description:"读取当前账户工作区的人工广告投入产出比记录及来源。缺少的明细和维度返回空值，不提供不存在的分群筛选或平台证据。",inputSchema:z.strictObject({}),async execute(input,ctx){return getAdInsights(input,toolOwner(ctx));}});
