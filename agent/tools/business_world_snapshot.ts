import { defineTool } from "eve/tools";
import { z } from "zod";
import { getBusinessWorldSnapshot } from "@/lib/business-world/real-service";

export default defineTool({
  description:
    "读取纸尿裤 Business World 的跨域经营快照，包含内容、直播、千川投放、交易和售后。读取 Business World 持久化状态及 provenance；未连接真实来源时明确返回 unavailable。",
  inputSchema: z.object({}),
  async execute() {
    return getBusinessWorldSnapshot();
  },
});
