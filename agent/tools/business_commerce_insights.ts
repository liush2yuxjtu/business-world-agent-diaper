import { defineTool } from "eve/tools";
import { z } from "zod";
import { getCommerceInsights } from "@/lib/business-world/mock-service";

export default defineTool({
  description:
    "读取抖店商品、库存、订单和售后模拟数据，支持按商品过滤。当前映射抖店开放平台能力，数据为 Demo / simulated。",
  inputSchema: z.object({
    productId: z.string().min(1).optional().describe("可选 Mock 商品 ID，例如 product-L"),
  }),
  label: {
    start: ({ productId }) => (productId ? `读取交易洞察：${productId}` : "读取交易洞察"),
  },
  async execute(input) {
    return getCommerceInsights(input);
  },
});
