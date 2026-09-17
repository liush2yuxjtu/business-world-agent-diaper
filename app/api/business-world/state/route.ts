import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { getBusinessWorldSnapshot, saveBusinessWorldState } from "@/lib/business-world/real-service";
import { getServerViewer } from "@/lib/session";


export async function GET() {
  try {
    return Response.json(await getBusinessWorldSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to read Business World state" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await getServerViewer())) {
    return Response.json({ error: "Authentication required for persisted writes" }, { status: 401 });
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return Response.json({ error: "Cross-origin writes are not allowed" }, { status: 403 });
  }
  try {
    const saved = await saveBusinessWorldState(await request.json());
    return Response.json({ ok: true, state: saved }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof ZodError ? 400 : 503;
    return Response.json({ error: error instanceof Error ? error.message : "Failed to persist Business World state" }, { status });
  }
}
