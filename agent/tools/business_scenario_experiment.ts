import { defineTool } from "eve/tools";
import { scenarioInputSchema,runScenarioExperiment } from "@/lib/business-world/real-service";
import { toolOwner } from "@/lib/business-world/tool-auth";
export default defineTool({description:"在当前账户的持久化基准上计算并保存经营情景。先读取当前 revision；禁止覆盖原始记录。模型为未校准的灵敏度假设，不代表观测或销量预测。",inputSchema:scenarioInputSchema,async execute(input,ctx){return runScenarioExperiment(input,toolOwner(ctx));}});
