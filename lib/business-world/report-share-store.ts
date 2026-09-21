import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readReports, reportOwner, ReportConflict } from './report-store';
import { sharedReportSnapshot, type ReportShare, type SharedReport } from './report-share-model';

const rest = 'https://mezthyaerhhohywcxmqi.supabase.co/rest/v1';
const key = 'sb_publishable__DV3WdzjR4_az6k_g5DrTQ_yAlNuQyn';
const fields = 'id,report_id,revision,created_at,expires_at,revoked_at';
const headers = (owner?: string) => ({ apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(owner ? { 'x-report-owner': owner } : {}) });

async function ownedRequest(query: string, init?: RequestInit): Promise<ReportShare[]> {
  const owner = await reportOwner();
  if (!owner) return [];
  const response = await fetch(`${rest}/business_world_report_share${query}`, { ...init, cache: 'no-store', headers: { ...headers(owner), Prefer: 'return=representation' } });
  if (!response.ok) throw new Error('Share storage unavailable');
  return response.json();
}
export async function listReportShares(reportId: string) {
  return ownedRequest(`?select=${fields}&report_id=eq.${reportId}&order=created_at.desc&limit=50`);
}
export async function createReportShare(reportId: string, revision: number) {
  const report = (await readReports(reportId))[0];
  if (!report) return null;
  if (report.revision !== revision) throw new ReportConflict();
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const rows = await ownedRequest(`?select=${fields}`, { method: 'POST', body: JSON.stringify({
    id: randomUUID(), owner_hash: await reportOwner(), report_id: report.id, revision,
    document: sharedReportSnapshot(report), token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }) });
  if (rows.length !== 1) throw new Error('Share not confirmed');
  return { share: rows[0], token };
}
export async function revokeReportShare(id: string) {
  const rows = await ownedRequest(`?select=${fields}&id=eq.${id}&revoked_at=is.null`, { method: 'PATCH', body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
  return rows[0] ?? null;
}
export async function readSharedReport(id: string, token: string): Promise<SharedReport | null> {
  const response = await fetch(`${rest}/rpc/read_business_world_report_share`, {
    method: 'POST', cache: 'no-store', headers: headers(),
    body: JSON.stringify({ share_id: id, access_hash: createHash('sha256').update(token).digest('hex') }),
  });
  if (!response.ok) throw new Error('Shared report unavailable');
  return response.json();
}
