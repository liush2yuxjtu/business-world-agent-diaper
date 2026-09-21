import { z } from 'zod';

export const liveAudienceSchema = z.object({
  source: z.string().trim().min(1).max(300),
  asOf: z.string().datetime(),
  period: z.string().trim().min(1).max(300),
  methodology: z.string().trim().min(1).max(1200),
  mode: z.enum(['simulated', 'observed']),
  segments: z.array(z.object({
    personaId: z.string().trim().min(1).max(120),
    viewers: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  })).max(100),
}).refine(value => new Set(value.segments.map(s => s.personaId)).size === value.segments.length,
  { message: '人群分段标识不能重复' });

export type LiveAudience = z.infer<typeof liveAudienceSchema>;

export function readLiveAudience(input: unknown, dataMode: string) {
  const result = liveAudienceSchema.safeParse(input);
  return result.success ? { ...result.data, mode: dataMode === 'simulated' ? 'simulated' as const : result.data.mode } : null;
}

// Only an unambiguous explicit identity may open a persona; names are not joins.
export function audiencePersona<T extends { id: string }>(people: T[], personaId: string): T | null {
  const matches = people.filter(person => person.id === personaId);
  return matches.length === 1 ? matches[0] : null;
}
