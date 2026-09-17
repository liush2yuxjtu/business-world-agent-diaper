import { defineTool } from "eve/tools";
import { z } from "zod";
import { getBusinessWorldSnapshot } from "@/lib/business-world/mock-service";

export default defineTool({
  description:
    "读取纸尿裤 Business World 的跨域经营快照，包含内容、直播、千川投放、交易和售后。当前数据源为 SQLite Demo / simulated 数据。",
  inputSchema: z.object({}),
  async execute() {
    return getBusinessWorldSnapshot();
  },
});
