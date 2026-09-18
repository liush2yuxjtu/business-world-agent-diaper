import { defineTool } from "eve/tools";
import { z } from "zod";
import { getCommerceInsights } from "@/lib/business-world/real-service";
import { toolOwner } from "@/lib/business-world/tool-auth";
export default defineTool({description:"读取当前账户工作区的人工交易金额、转化、复购和收入记录及来源。缺少的明细和维度返回空值，不提供不存在的分群筛选或平台证据。",inputSchema:z.strictObject({}),async execute(input,ctx){return getCommerceInsights(input,toolOwner(ctx));}});
