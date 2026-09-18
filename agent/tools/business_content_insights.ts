import { defineTool } from "eve/tools";
import { z } from "zod";
import { getContentInsights } from "@/lib/business-world/real-service";
import { toolOwner } from "@/lib/business-world/tool-auth";
export default defineTool({description:"读取当前账户工作区的人工内容互动次数记录及来源。缺少的明细和维度返回空值，不提供不存在的分群筛选或平台证据。",inputSchema:z.strictObject({}),async execute(input,ctx){return getContentInsights(input,toolOwner(ctx));}});
