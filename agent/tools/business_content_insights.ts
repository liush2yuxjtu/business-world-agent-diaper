import { defineTool } from "eve/tools";
import { z } from "zod";
import { getContentInsights } from "@/lib/business-world/mock-service";

const persona = z.enum(["xiaoyu", "alin", "wangayi", "mia"]);

export default defineTool({
  description:
    "读取抖音内容表现和评论洞察，支持按 Persona 过滤评论。当前映射抖音视频数据与评论能力，数据为 Demo / simulated。",
  inputSchema: z.object({
    personaId: persona.optional().describe("可选 Persona：xiaoyu / alin / wangayi / mia"),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  async execute(input) {
    return getContentInsights(input);
  },
});
