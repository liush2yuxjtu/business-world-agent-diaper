import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { listScenarioExperiments, runScenarioExperiment } from "@/lib/business-world/real-service";

export async function GET() {
  try {
    return Response.json(
      { runs: await listScenarioExperiments() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Scenario history failed" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Cross-origin writes are not allowed" }, { status: 403 });
  }
  try {
    return Response.json(
      await runScenarioExperiment(await request.json()),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 503;
    return Response.json(
      { error: error instanceof Error ? error.message : "Scenario run failed" },
      { status },
    );
  }
}
