import { z } from 'zod';
import { reportSections, type ReportSection } from './report-content';
import type { SavedReport } from './report-model';

export const shareCreateInput = z.strictObject({ reportId: z.string().uuid(), revision: z.number().int().min(1) });
export const shareReadInput = z.strictObject({ id: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) });
export type SharedReport = { title: string; reportId: string; revision: number; createdAt: string; sections: ReportSection[] };
export type ReportShare = { id: string; report_id: string; revision: number; created_at: string; expires_at: string; revoked_at: string | null };

export function sharedReportSnapshot(report: SavedReport): SharedReport {
  return structuredClone({ title: report.title, reportId: report.id, revision: report.revision, createdAt: report.createdAt, sections: reportSections(report) });
}
