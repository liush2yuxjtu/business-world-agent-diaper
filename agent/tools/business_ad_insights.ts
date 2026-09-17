import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAdInsights } from "@/lib/business-world/mock-service";

export default defineTool({
  description:
    "读取巨量千川投放计划与模拟报表，包含预算、消耗、CTR、CVR、CPA、收入和 ROI。当前数据为 Demo / simulated。",
  inputSchema: z.object({
    campaignId: z.string().min(1).optional().describe("可选 Mock 投放计划 ID，例如 ad-001"),
  }),
  label: {
    start: ({ campaignId }) => (campaignId ? `读取千川投放：${campaignId}` : "读取千川投放"),
  },
  async execute(input) {
    return getAdInsights(input);
  },
});
