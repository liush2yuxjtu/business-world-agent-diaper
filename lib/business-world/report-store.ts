import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getBusinessWorldSnapshot } from './real-service';
import { presentSnapshot } from './presentation';
import { composeReport, type SavedReport } from './report-model';

const cookieName = 'bw-report-workspace';
const endpoint = 'https://mezthyaerhhohywcxmqi.supabase.co/rest/v1/business_world_report';
const publishableKey = 'sb_publishable__DV3WdzjR4_az6k_g5DrTQ_yAlNuQyn';
export const reportInput = z.strictObject({ title: z.string().trim().min(1).max(120), audience: z.string().trim().min(1).max(80) });
export const noteInput = z.strictObject({ id: z.string().uuid(), revision: z.number().int().min(1), note: z.string().max(4000) });
export class ReportConflict extends Error {}

async function owner(create = false) {
  const jar = await cookies();
  let token = jar.get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    if (!create) return null;
    token = randomBytes(32).toString('hex');
    jar.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return createHash('sha256').update(token).digest('hex');
}

async function request(ownerHash: string, query: string, init?: RequestInit) {
  const response = await fetch(endpoint + query, {
    ...init, cache: 'no-store', headers: {
      apikey: publishableKey, Authorization: `Bearer ${publishableKey}`,
      'x-report-owner': ownerHash, 'Content-Type': 'application/json', Prefer: 'return=representation',
    },
  });
  if (!response.ok) throw new Error('Report storage unavailable');
  return await response.json() as Array<{ document: SavedReport; revision: number }>;
}

export async function readReports(id?: string) {
  const ownerHash = await owner();
  if (!ownerHash) return [];
  const rows = await request(ownerHash, `?select=document,revision&order=created_at.desc&limit=50${id ? `&id=eq.${encodeURIComponent(id)}` : ''}`);
  return rows.map(row => ({ ...row.document, revision: row.revision }));
}

export async function createReport(raw: unknown) {
  const input = reportInput.parse(raw);
  const snapshot = presentSnapshot(await getBusinessWorldSnapshot());
  if (!snapshot.data) throw new Error('Report baseline unavailable');
  const ownerHash = (await owner(true))!;
  const report = composeReport(snapshot, { ...input, id: randomUUID() }, new Date().toISOString());
  const rows = await request(ownerHash, '', { method: 'POST', body: JSON.stringify({ id: report.id, owner_hash: ownerHash, document: report }) });
  if (rows.length !== 1) throw new Error('Report save not confirmed');
  return { ...rows[0].document, revision: rows[0].revision };
}

export async function saveReportNote(raw: unknown) {
  const input = noteInput.parse(raw);
  const ownerHash = await owner();
  if (!ownerHash) return null;
  const current = (await readReports(input.id))[0];
  if (!current) return null;
  if (current.revision !== input.revision) throw new ReportConflict();
  const updated = { ...current, humanNote: input.note, revision: current.revision + 1 };
  const rows = await request(ownerHash, `?id=eq.${input.id}&revision=eq.${input.revision}`, {
    method: 'PATCH', body: JSON.stringify({ document: updated, revision: updated.revision }),
  });
  if (rows.length !== 1) throw new ReportConflict();
  return { ...rows[0].document, revision: rows[0].revision };
}
