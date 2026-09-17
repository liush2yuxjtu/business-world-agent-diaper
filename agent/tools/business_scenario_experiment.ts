import { defineTool } from "eve/tools";
import { z } from "zod";
import { runScenarioExperiment } from "@/lib/business-world/mock-service";

const persona = z.enum(["xiaoyu", "alin", "wangayi", "mia"]);
const lever = z.enum([
  "content_engagement",
  "live_watch_time",
  "ad_efficiency",
  "checkout_conversion",
  "repeat_purchase",
]);

export default defineTool({
  description:
    "对 Business World 做透明的 Scenario Experiment。输入经营杠杆和变化幅度，返回基于固定模拟弹性的方向性结果；不是市场预测。",
  inputSchema: z.object({
    lever,
    changePercent: z.number().min(-80).max(200).describe("相对变化百分比，例如 10 表示 +10%"),
    personaId: persona.optional().describe("可选：只对某个 Persona 的模拟订单基线做推演"),
  }),
  label: {
    start: ({ lever, changePercent }) => `推演 ${lever} ${changePercent >= 0 ? "+" : ""}${changePercent}%`,
  },
  async execute(input) {
    return runScenarioExperiment(input);
  },
});
