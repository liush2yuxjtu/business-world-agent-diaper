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
    const rawCursor = request.nextUrl.searchParams.get('cursor');
    let before: { createdAt: string; id: string } | undefined;
    if (rawCursor !== null) {
      try { before = z.object({ createdAt: z.string().datetime({ offset: true }), id: z.string().uuid() }).strict().parse(JSON.parse(rawCursor)); }
      catch { return Response.json({ code: 'INVALID_CURSOR', error: '历史列表位置无效，请刷新记录。' }, { status: 400 }); }
    }
    const pageSize = query === null ? 8 : 20;
    const rows = await listScenarioExperiments(pageSize + 1, query ?? '', before);
    const runs = rows.slice(0, pageSize);
    const last = runs.at(-1);
    const nextCursor = rows.length > pageSize && last ? JSON.stringify({ createdAt: last.cursorCreatedAt, id: last.id }) : null;
    return Response.json(
      { runs, nextCursor },
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
