import { NextRequest } from 'next/server';
import { z } from 'zod';
import { crossOriginResponse } from '@/lib/business-world/public-errors';
import { shareCreateInput } from '@/lib/business-world/report-share-model';
import { createReportShare, listReportShares, revokeReportShare } from '@/lib/business-world/report-share-store';
import { ReportConflict } from '@/lib/business-world/report-store';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
function failure(error: unknown) {
  if (error instanceof z.ZodError || error instanceof SyntaxError) return json({ error: '分享参数无效，请重新选择报告。' }, 400);
  if (error instanceof ReportConflict) return json({ error: '报告已有更新，请重新读取后分享。' }, 409);
  return json({ error: '暂时无法确认分享操作，请重新读取。' }, 503);
}
export async function GET(request: NextRequest) {
  try { const id = z.string().uuid().parse(request.nextUrl.searchParams.get('reportId')); return json({ shares: await listReportShares(id) }); } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  const rejected = crossOriginResponse(request); if (rejected) return rejected;
  try {
    const input = shareCreateInput.parse(await request.json());
    const result = await createReportShare(input.reportId, input.revision);
    return result ? json(result, 201) : json({ error: '当前浏览器未找到这份报告。' }, 404);
  } catch (error) { return failure(error); }
}
export async function PATCH(request: NextRequest) {
  const rejected = crossOriginResponse(request); if (rejected) return rejected;
  try {
    const { id } = z.strictObject({ id: z.string().uuid() }).parse(await request.json());
    const share = await revokeReportShare(id);
    return share ? json({ share }) : json({ error: '未找到可撤销的分享，请刷新列表。' }, 404);
  } catch (error) { return failure(error); }
}
