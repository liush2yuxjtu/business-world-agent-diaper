import { NextRequest } from 'next/server';
import { z } from 'zod';
import { crossOriginResponse } from '@/lib/business-world/public-errors';
import { ContentDraftError, createContentDraft, readContentDrafts, updateContentDraft } from '@/lib/business-world/content-draft-store';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
function failure(error: unknown) {
  if (error instanceof z.ZodError || error instanceof SyntaxError) return json({ code: 'CONTENT_INVALID' }, 400);
  if (error instanceof ContentDraftError) {
    const status = { CONTENT_INVALID: 400, CONTENT_MISSING: 404, CONTENT_SOURCE_MISSING: 404, CONTENT_CONFLICT: 409 }[error.message] ?? 503;
    return json({ code: status === 503 ? 'CONTENT_UNAVAILABLE' : error.message }, status);
  }
  return json({ code: 'CONTENT_UNAVAILABLE' }, 503);
}
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (id) z.string().uuid().parse(id);
    const drafts = await readContentDrafts(id ?? undefined);
    if (id && !drafts.length) return json({ code: 'CONTENT_MISSING' }, 404);
    return json(id ? drafts[0] : { drafts });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  const rejected = crossOriginResponse(request); if (rejected) return rejected;
  try { return json(await createContentDraft(await request.json()), 201); } catch (error) { return failure(error); }
}
export async function PATCH(request: NextRequest) {
  const rejected = crossOriginResponse(request); if (rejected) return rejected;
  try { return json(await updateContentDraft(await request.json())); } catch (error) { return failure(error); }
}
