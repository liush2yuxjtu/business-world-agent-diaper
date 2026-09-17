import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAdInsights } from "@/lib/business-world/real-service";

export default defineTool({
  description:
    "读取巨量千川投放计划与模拟报表，包含预算、消耗、CTR、CVR、CPA、收入和 ROI。数据来自 Business World 的持久化真实状态；未连接真实来源时返回 unavailable，不回退到 mock。",
  inputSchema: z.object({
    campaignId: z.string().min(1).optional().describe("保留兼容参数；当前真实状态为聚合投放数据"),
  }),
  async execute(input) {
    return getAdInsights(input);
  },
});
