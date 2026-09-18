import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { businessWorldWriteSchema,saveBusinessWorldState } from "@/lib/business-world/real-service";
import { toolOwner } from "@/lib/business-world/tool-auth";
export default defineTool({description:"经用户确认后保存人工经营记录，供当前账户的 UI 和 Agent 共用。先读取当前 revision；人工录入不自动成为官方或已核验数据。不得填补用户未提供的数值。",inputSchema:businessWorldWriteSchema,approval:always(),async execute(input,ctx){return saveBusinessWorldState(input,toolOwner(ctx));}});
