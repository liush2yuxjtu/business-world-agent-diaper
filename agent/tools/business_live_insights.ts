import { defineTool } from "eve/tools";
import { z } from "zod";
import { getLiveInsights } from "@/lib/business-world/real-service";

export default defineTool({
  description:
    "读取直播间曝光、看播、互动、商品点击、加购、支付和 GMV 漏斗。当前映射抖音直播数据能力，数据为 Demo / simulated。",
  inputSchema: z.object({
    roomId: z.string().min(1).optional().describe("可选 Mock 直播间 ID，例如 live-001"),
  }),
  async execute(input) {
    return getLiveInsights(input);
  },
});
