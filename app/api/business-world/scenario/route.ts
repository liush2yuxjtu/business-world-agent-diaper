import { z } from "zod";
import { runScenarioExperiment } from "@/lib/business-world/mock-service";


const bodySchema = z.object({
  lever: z.enum([
    "content_engagement",
    "live_watch_time",
    "ad_efficiency",
    "checkout_conversion",
    "repeat_purchase",
  ]),
  changePercent: z.number().min(-80).max(200),
  personaId: z.enum(["xiaoyu", "alin", "wangayi", "mia"]).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid scenario input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  return Response.json(runScenarioExperiment(parsed.data));
}
