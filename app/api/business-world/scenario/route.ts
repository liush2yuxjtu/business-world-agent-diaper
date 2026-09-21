import { NextRequest } from "next/server";
import { crossOriginResponse, errorResponse } from "@/lib/business-world/public-errors";
import { listScenarioExperiments, runScenarioExperiment } from "@/lib/business-world/real-service";

export async function GET() {
  try {
    return Response.json(
      { runs: await listScenarioExperiments() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "HISTORY_FAILED");
  }
}

export async function POST(request: NextRequest) {
  const rejected = crossOriginResponse(request);
  if (rejected) return rejected;
  try {
    return Response.json(
      await runScenarioExperiment(await request.json()),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "SCENARIO_FAILED", "INVALID_INPUT");
  }
}
