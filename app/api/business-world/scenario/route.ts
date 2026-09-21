import { z } from "zod";
import { NextRequest } from "next/server";
import { crossOriginResponse, errorResponse } from "@/lib/business-world/public-errors";
import { getScenarioExperiment, listScenarioExperiments, runScenarioExperiment } from "@/lib/business-world/real-service";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (id !== null) {
      const parsed = z.string().uuid().safeParse(id);
      if (!parsed.success) return Response.json({ code: 'INVALID_RECORD', error: '情景记录链接无效，请从历史记录重新选择。' }, { status: 400 });
      const run = await getScenarioExperiment(parsed.data);
      if (!run) return Response.json({ code: 'RECORD_NOT_FOUND', error: '未找到这条情景记录，请刷新历史记录后重试。' }, { status: 404 });
      return Response.json(run, { headers: { 'Cache-Control': 'no-store' } });
    }
    const query = request.nextUrl.searchParams.get('q');
    if (query !== null) z.string().max(200).parse(query);
    return Response.json(
      { runs: await listScenarioExperiments(query === null ? 8 : 20, query ?? '') },
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
