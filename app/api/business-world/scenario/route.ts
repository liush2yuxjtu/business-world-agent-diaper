import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { runScenarioExperiment } from "@/lib/business-world/real-service";
import { getServerViewer } from "@/lib/session";


export async function POST(request: NextRequest) {
  if (!(await getServerViewer())) {
    return Response.json({ error: "Authentication required for persisted writes" }, { status: 401 });
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Cross-origin writes are not allowed" }, { status: 403 });
  }
  try {
    return Response.json(await runScenarioExperiment(await request.json()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 503;
    return Response.json({ error: error instanceof Error ? error.message : "Scenario run failed" }, { status });
  }
}
