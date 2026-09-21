import { randomUUID } from 'node:crypto';
import { reportOwner } from './report-store';
import { getBusinessWorldSnapshot } from './real-service';
import { presentSnapshot } from './presentation';
import { composeContentBrief, composeContentPlan, createDraftInput, editDraftInput, type ContentDraft } from './content-draft-model';

const endpoint = 'https://mezthyaerhhohywcxmqi.supabase.co/rest/v1/business_world_content_draft';
const key = 'sb_publishable__DV3WdzjR4_az6k_g5DrTQ_yAlNuQyn';
export class ContentDraftError extends Error {}
async function request(query: string, init?: RequestInit, create = false) {
  const owner = await reportOwner(create);
  if (!owner) return [];
  const response = await fetch(endpoint + query, { ...init, cache: 'no-store', headers: { apikey: key, Authorization: `Bearer ${key}`, 'x-report-owner': owner, 'Content-Type': 'application/json', Prefer: 'return=representation' } });
  if (!response.ok) throw new ContentDraftError('CONTENT_UNAVAILABLE');
  return await response.json() as Array<{ document: ContentDraft; revision: number }>;
}
export async function readContentDrafts(id?: string) {
  const rows = await request(`?select=document,revision&order=created_at.desc&limit=100${id ? `&id=eq.${id}` : ''}`);
  return rows.map(row => ({ ...row.document, revision: row.revision }));
}
export async function createContentDraft(raw: unknown) {
  const input = createDraftInput.parse(raw);
  let draft: ContentDraft;
  if (input.kind === 'brief') {
    const snapshot = presentSnapshot(await getBusinessWorldSnapshot());
    if (!snapshot.data?.content.topTopics.some(topic => topic.title === input.topicTitle)) throw new ContentDraftError('CONTENT_SOURCE_MISSING');
    draft = composeContentBrief(snapshot, input.topicTitle, randomUUID(), new Date().toISOString());
  } else {
    const brief = (await readContentDrafts(input.briefId))[0];
    if (!brief || brief.kind !== 'brief') throw new ContentDraftError('CONTENT_MISSING');
    if (brief.revision !== input.revision) throw new ContentDraftError('CONTENT_CONFLICT');
    draft = composeContentPlan(brief, { id: randomUUID(), scheduledFor: input.scheduledFor, channel: input.channel }, new Date().toISOString());
  }
  const owner = await reportOwner(true);
  const rows = await request('', { method: 'POST', body: JSON.stringify({ id: draft.id, owner_hash: owner, document: draft }) });
  if (rows.length !== 1) throw new ContentDraftError('CONTENT_UNAVAILABLE');
  return { ...rows[0].document, revision: rows[0].revision };
}
export async function updateContentDraft(raw: unknown) {
  const input = editDraftInput.parse(raw);
  const current = (await readContentDrafts(input.id))[0];
  if (!current) throw new ContentDraftError('CONTENT_MISSING');
  if (current.revision !== input.revision) throw new ContentDraftError('CONTENT_CONFLICT');
  if (current.kind === 'brief' && (input.channel !== undefined || input.scheduledFor !== undefined)) throw new ContentDraftError('CONTENT_INVALID');
  const updated = { ...current, title: input.title, body: input.body, revision: current.revision + 1,
    ...(current.kind === 'plan' ? { scheduledFor: input.scheduledFor ?? current.scheduledFor, channel: input.channel ?? current.channel } : {}),
  };
  const rows = await request(`?id=eq.${input.id}&revision=eq.${input.revision}`, { method: 'PATCH', body: JSON.stringify({ document: updated, revision: updated.revision }) });
  if (rows.length !== 1) throw new ContentDraftError('CONTENT_CONFLICT');
  return { ...rows[0].document, revision: rows[0].revision };
}
