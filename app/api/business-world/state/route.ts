import { NextRequest } from "next/server";
import { crossOriginResponse, errorResponse } from "@/lib/business-world/public-errors";
import { getBusinessWorldSnapshot, saveBusinessWorldState } from "@/lib/business-world/real-service";

export async function GET() {
  try {
    return Response.json(
      await getBusinessWorldSnapshot(),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "READ_FAILED");
  }
}

export async function PUT(request: NextRequest) {
  const rejected = crossOriginResponse(request);
  if (rejected) return rejected;
  try {
    const saved = await saveBusinessWorldState(await request.json());
    return Response.json(
      { ok: true, state: saved },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "SAVE_FAILED", "INVALID_STATE");
  }
}
