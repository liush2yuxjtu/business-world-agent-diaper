import { defineTool } from "eve/tools";
import { z } from "zod";
import { getCommerceInsights } from "@/lib/business-world/real-service";

export default defineTool({
  description:
    "读取抖店商品、库存、订单和售后模拟数据，支持按商品过滤。数据来自 Business World 的持久化真实状态；未连接真实来源时返回 unavailable，不回退到 mock。",
  inputSchema: z.object({
    productId: z.string().min(1).optional().describe("保留兼容参数；当前真实状态为聚合商品数据"),
  }),
  async execute(input) {
    return getCommerceInsights(input);
  },
});
