import { NextRequest } from 'next/server';
import { crossOriginResponse } from '@/lib/business-world/public-errors';
import { shareReadInput } from '@/lib/business-world/report-share-model';
import { readSharedReport } from '@/lib/business-world/report-share-store';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' } });
export async function POST(request: NextRequest) {
  const rejected = crossOriginResponse(request); if (rejected) return rejected;
  try {
    const input = shareReadInput.safeParse(await request.json());
    if (!input.success) return json({ error: '分享链接无效。' }, 400);
    const report = await readSharedReport(input.data.id, input.data.token);
    return report ? json({ report }) : json({ error: '分享已失效、已撤销或链接不完整。' }, 404);
  } catch { return json({ error: '暂时无法读取分享报告，请稍后重试。' }, 503); }
}
