import { NextRequest } from 'next/server';
import { z } from 'zod';
import { crossOriginResponse } from '@/lib/business-world/public-errors';
import { createReport, readReports, readReportPage, reportCursorSchema, ReportConflict, ReportScenarioMissing, saveReportNote } from '@/lib/business-world/report-store';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
function failure(error: unknown) {
  if (error instanceof ReportScenarioMissing) return json({ code: 'REPORT_SCENARIO_MISSING', error: '未找到关联情景，请从实验历史重新选择。' }, 404);
  if (error instanceof z.ZodError || error instanceof SyntaxError) return json({ code: 'REPORT_INVALID', error: '请检查报告标题、读者和备注长度。' }, 400);
  if (error instanceof ReportConflict) return json({ code: 'REPORT_CONFLICT', error: '这份报告已有更新，请重新读取后再保存。' }, 409);
  return json({ code: 'REPORT_UNAVAILABLE', error: '暂时无法确认报告读写结果，请稍后重新读取。' }, 503);
}
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (id !== null && !z.string().uuid().safeParse(id).success) return json({ code: 'REPORT_INVALID', error: '报告链接无效，请从历史记录选择。' }, 400);
    if (id === null) {
      const rawCursor = request.nextUrl.searchParams.get('cursor');
      let cursor;
      try { cursor = rawCursor === null ? undefined : reportCursorSchema.parse(JSON.parse(rawCursor)); }
      catch { return json({ code: 'REPORT_CURSOR_INVALID', error: '历史报告列表位置无效，请刷新列表。' }, 400); }
      return json(await readReportPage(cursor));
    }
    const reports = await readReports(id);
    if (id && !reports.length) return json({ code: 'REPORT_MISSING', error: '当前浏览器未找到这份报告。' }, 404);
    return json(reports[0]);
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  const rejected = crossOriginResponse(request);
  if (rejected) return rejected;
  try { return json(await createReport(await request.json()), 201); } catch (error) { return failure(error); }
}
export async function PATCH(request: NextRequest) {
  const rejected = crossOriginResponse(request);
  if (rejected) return rejected;
  try {
    const report = await saveReportNote(await request.json());
    return report ? json(report) : json({ code: 'REPORT_MISSING', error: '当前浏览器未找到这份报告。' }, 404);
  } catch (error) { return failure(error); }
}
