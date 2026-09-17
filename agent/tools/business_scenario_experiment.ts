import { defineTool } from "eve/tools";
import { z } from "zod";
import { runScenarioExperiment } from "@/lib/business-world/real-service";

const lever = z.enum([
  "content_engagement",
  "live_watch_time",
  "ad_efficiency",
  "checkout_conversion",
  "repeat_purchase",
]);

export default defineTool({
  description:
    "基于 Business World 已持久化的真实基线运行透明 Scenario Experiment。结果是可复现数学模型，不冒充已观测市场结果。",
  inputSchema: z.object({
    prompt: z.string().min(3).max(1000).default("Business World scenario"),
    lever,
    changePercent: z.number().min(-80).max(200).describe("相对变化百分比，例如 10 表示 +10%"),
  }),
  async execute(input) {
    return runScenarioExperiment(input);
  },
});
