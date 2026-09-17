import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/lib/db/client";

export const businessWorldPayloadSchema = z.object({
  content: z.object({
    engagementRate: z.number().min(0).max(100).nullable(),
    weeklyOpportunities: z.number().int().min(0).nullable(),
  }),
  live: z.object({
    roomEntryRate: z.number().min(0).max(100).nullable(),
    cartRate: z.number().min(0).max(100).nullable(),
  }),
  commerce: z.object({
    conversionRate: z.number().min(0).max(100).nullable(),
    gmv: z.number().min(0).nullable(),
    newCustomers: z.number().int().min(0).nullable(),
  }),
  ads: z.object({
    budget: z.number().min(0).nullable(),
    roi: z.number().min(0).nullable(),
    cpa: z.number().min(0).nullable(),
  }),
  notes: z.string().max(2000).default(""),
});

export type BusinessWorldPayload = z.infer<typeof businessWorldPayloadSchema>;

export const businessWorldWriteSchema = z.object({
  sourceLabel: z.string().trim().min(2).max(120),
  sourceType: z.enum(["manual-entry", "csv-import", "official-api"]),
  observedAt: z.string().datetime(),
  payload: businessWorldPayloadSchema,
});

export type BusinessWorldState = {
  id: string;
  sourceLabel: string;
  sourceType: "manual-entry" | "csv-import" | "official-api";
  observedAt: string;
  updatedAt: string;
  payload: BusinessWorldPayload;
};

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured; verified Business World state cannot be persisted.");
  }

  await db.execute(sql`
    create table if not exists business_world_state (
      id text primary key,
      source_label text not null,
      source_type text not null,
      observed_at timestamptz not null,
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await db.execute(sql`
    create table if not exists business_world_scenario_run (
      id text primary key,
      prompt text not null,
      lever text not null,
      change_percent double precision not null,
      baseline jsonb,
      result jsonb not null,
      source_state_id text,
      created_at timestamptz not null default now()
    )
  `);
  schemaReady = true;
}

export async function getBusinessWorldState(): Promise<BusinessWorldState | null> {
  if (!isDatabaseConfigured()) return null;
  await ensureSchema();
  const result = await db.execute(sql`
    select id, source_label, source_type, observed_at, updated_at, payload
    from business_world_state
    where id = 'primary'
    limit 1
  `);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    sourceLabel: String(row.source_label),
    sourceType: row.source_type as BusinessWorldState["sourceType"],
    observedAt: new Date(String(row.observed_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    payload: businessWorldPayloadSchema.parse(row.payload),
  };
}

export async function saveBusinessWorldState(input: unknown): Promise<BusinessWorldState> {
  await ensureSchema();
  const parsed = businessWorldWriteSchema.parse(input);
  await db.execute(sql`
    insert into business_world_state (id, source_label, source_type, observed_at, payload, updated_at)
    values ('primary', ${parsed.sourceLabel}, ${parsed.sourceType}, ${parsed.observedAt}::timestamptz, ${JSON.stringify(parsed.payload)}::jsonb, now())
    on conflict (id) do update set
      source_label = excluded.source_label,
      source_type = excluded.source_type,
      observed_at = excluded.observed_at,
      payload = excluded.payload,
      updated_at = now()
  `);
  const saved = await getBusinessWorldState();
  if (!saved) throw new Error("Business World state write did not persist.");
  return saved;
}

function provenance(state: BusinessWorldState | null) {
  return state
    ? {
        sourceMode: "persisted-observation" as const,
        provider: state.sourceType,
        sourceLabel: state.sourceLabel,
        asOf: state.observedAt,
        updatedAt: state.updatedAt,
        storage: "Neon Postgres",
      }
    : {
        sourceMode: "unavailable" as const,
        provider: "none",
        sourceLabel: "No verified business source connected",
        asOf: null,
        updatedAt: null,
        storage: isDatabaseConfigured() ? "Neon Postgres" : "not-configured",
      };
}

export async function getBusinessWorldSnapshot() {
  const state = await getBusinessWorldState();
  return { provenance: provenance(state), data: state?.payload ?? null };
}

export async function getContentInsights(_input?: unknown) {
  const state = await getBusinessWorldState();
  return { provenance: provenance(state), data: state?.payload.content ?? null };
}

export async function getLiveInsights(_input?: unknown) {
  const state = await getBusinessWorldState();
  return { provenance: provenance(state), data: state?.payload.live ?? null };
}

export async function getAdInsights(_input?: unknown) {
  const state = await getBusinessWorldState();
  return { provenance: provenance(state), data: state?.payload.ads ?? null };
}

export async function getCommerceInsights(_input?: unknown) {
  const state = await getBusinessWorldState();
  return { provenance: provenance(state), data: state?.payload.commerce ?? null };
}

const leverSchema = z.enum([
  "content_engagement",
  "live_watch_time",
  "ad_efficiency",
  "checkout_conversion",
  "repeat_purchase",
]);

export async function runScenarioExperiment(input: unknown) {
  await ensureSchema();
  const parsed = z.object({
    prompt: z.string().trim().min(3).max(1000).default("Business World scenario"),
    lever: leverSchema,
    changePercent: z.number().min(-80).max(200),
  }).parse(input);
  const state = await getBusinessWorldState();
  const baselineRoi = state?.payload.ads.roi ?? null;
  const baselineConversion = state?.payload.commerce.conversionRate ?? null;
  const multiplier = 1 + parsed.changePercent / 100;
  const result = {
    modeled: true,
    assumption: `${parsed.lever} changes by ${parsed.changePercent}%`,
    baselineRoi,
    modeledRoi: baselineRoi == null ? null : Number((baselineRoi * multiplier).toFixed(2)),
    baselineConversionRate: baselineConversion,
    modeledConversionRate:
      baselineConversion == null ? null : Number((baselineConversion * multiplier).toFixed(2)),
    warning: "Scenario output is a transparent mathematical model over the persisted baseline, not an observed market outcome or AI prediction.",
  };
  const id = randomUUID();
  await db.execute(sql`
    insert into business_world_scenario_run
      (id, prompt, lever, change_percent, baseline, result, source_state_id)
    values
      (${id}, ${parsed.prompt}, ${parsed.lever}, ${parsed.changePercent}, ${JSON.stringify(state?.payload ?? null)}::jsonb, ${JSON.stringify(result)}::jsonb, ${state?.id ?? null})
  `);
  return { id, provenance: provenance(state), result };
}
