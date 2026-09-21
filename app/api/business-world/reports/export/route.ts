import { NextRequest } from 'next/server';
import { z } from 'zod';
import { readReports } from '@/lib/business-world/report-store';
import { exportReportPdf, exportReportPptx } from '@/lib/business-world/report-export';

const inputSchema = z.object({ id: z.string().uuid(), revision: z.coerce.number().int().min(1), format: z.enum(['pdf', 'pptx']) });
const failure = (code: string, error: string, status: number) => Response.json({ code, error }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: NextRequest) {
  const input = inputSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!input.success) return failure('REPORT_INVALID', '请选择已保存报告后再导出。', 400);
  try {
    const { id, revision, format } = input.data;
    const report = (await readReports(id))[0];
    if (!report) return failure('REPORT_MISSING', '当前浏览器未找到这份报告。', 404);
    if (report.revision !== revision) return failure('REPORT_CONFLICT', '这份报告已有更新，请重新读取后再导出。', 409);
    const bytes = format === 'pdf' ? await exportReportPdf(report) : await exportReportPptx(report);
    return new Response(new Uint8Array(bytes), { headers: {
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="business-world-report-${id}-v${revision}.${format}"`,
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    } });
  } catch { return failure('REPORT_UNAVAILABLE', '暂时无法导出报告，请稍后重试。', 503); }
}
