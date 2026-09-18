import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/lib/db/client";

const SUPABASE_URL = "https://mezthyaerhhohywcxmqi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__DV3WdzjR4_az6k_g5DrTQ_yAlNuQyn";
const SUPABASE_STATE_ENDPOINT = `${SUPABASE_URL}/rest/v1/business_world_state?id=eq.primary&select=id,source_label,source_type,observed_at,updated_at,payload`;
const SUPABASE_SCENARIO_ENDPOINT = `${SUPABASE_URL}/rest/v1/business_world_scenario_run`;

export const businessWorldPayloadSchema = z.object({
  meta: z.object({
    dataMode: z.enum(["simulated", "observed"]),
    datasetVersion: z.string(),
    designSource: z.string(),
    warning: z.string(),
  }),
  personas: z.array(z.object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
    goal: z.string(),
    pain: z.string(),
    content: z.string(),
    trigger: z.string(),
    population: z.number().int().min(0).nullable(),
    conversionRate: z.number().min(0).max(100).nullable(),
    repeatRate: z.number().min(0).max(100).nullable(),
    gmvShare: z.number().min(0).max(100).nullable(),
  })),
  content: z.object({
    engagementRate: z.number().min(0).max(100).nullable(),
    weeklyOpportunities: z.number().int().min(0).nullable(),
    totalPlays: z.number().int().min(0).nullable(),
    interactions: z.number().int().min(0).nullable(),
    topTopics: z.array(z.object({ title: z.string(), persona: z.string(), potential: z.string() })),
    scripts: z.array(z.object({ name: z.string(), durationSec: z.number().int().min(0), format: z.string() })),
  }),
  live: z.object({
    roomEntryRate: z.number().min(0).max(100).nullable(),
    cartRate: z.number().min(0).max(100).nullable(),
    avgWatchSec: z.number().min(0).nullable(),
    payConversionRate: z.number().min(0).max(100).nullable(),
    exposureUv: z.number().int().min(0).nullable(),
    watchUv: z.number().int().min(0).nullable(),
    peakOnline: z.number().int().min(0).nullable(),
    paidOrders: z.number().int().min(0).nullable(),
    gmv: z.number().min(0).nullable(),
    sessions: z.array(z.object({
      id: z.string(), title: z.string(), durationMin: z.number().min(0), watchUv: z.number().int().min(0),
      cartRate: z.number().min(0).max(100), paidOrders: z.number().int().min(0), gmv: z.number().min(0),
    })),
  }),
  commerce: z.object({
    conversionRate: z.number().min(0).max(100).nullable(),
    gmv: z.number().min(0).nullable(),
    newCustomers: z.number().int().min(0).nullable(),
    refundRate: z.number().min(0).max(100).nullable(),
    sellThroughRate: z.number().min(0).max(100).nullable(),
    aov: z.number().min(0).nullable(),
    products: z.array(z.object({
      id: z.string(), name: z.string(), size: z.string(), price: z.number().min(0), gmv: z.number().min(0),
      conversionRate: z.number().min(0).max(100), stockDays: z.number().min(0), refundRate: z.number().min(0).max(100),
      image: z.string(),
    })),
  }),
  ads: z.object({
    budget: z.number().min(0).nullable(),
    spend: z.number().min(0).nullable(),
    roi: z.number().min(0).nullable(),
    cpa: z.number().min(0).nullable(),
    ctr: z.number().min(0).max(100).nullable(),
    newCustomerCost: z.number().min(0).nullable(),
    channelMix: z.array(z.object({ channel: z.string(), share: z.number().min(0).max(100) })),
    campaigns: z.array(z.object({
      id: z.string(), name: z.string(), channel: z.string(), budget: z.number().min(0), spend: z.number().min(0),
      ctr: z.number().min(0).max(100), cpa: z.number().min(0), roi: z.number().min(0), status: z.string(),
    })),
    creatives: z.array(z.object({ name: z.string(), roi: z.number().min(0) })),
  }),
  report: z.object({
    period: z.string(), audience: z.string(), headline: z.string(), summary: z.string(), sections: z.array(z.string()),
  }),
  notes: z.string().max(4000).default(""),
});

export type BusinessWorldPayload = z.infer<typeof businessWorldPayloadSchema>;

export const businessWorldWriteSchema = z.object({
  sourceLabel: z.string().trim().min(2).max(120),
  sourceType: z.enum(["system-record", "manual-entry", "csv-import", "official-api", "simulated"]),
  observedAt: z.string().datetime(),
  payload: businessWorldPayloadSchema,
});

export type BusinessWorldState = {
  id: string;
  sourceLabel: string;
  sourceType: "system-record" | "manual-entry" | "csv-import" | "official-api" | "simulated";
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

async function getSupabaseFallbackState(): Promise<BusinessWorldState | null> {
  const response = await fetch(SUPABASE_STATE_ENDPOINT, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase Business World read failed: ${response.status}`);
  const rows = (await response.json()) as Array<Record<string, unknown>>;
  const row = rows[0];
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

export async function getBusinessWorldState(): Promise<BusinessWorldState | null> {
  if (!isDatabaseConfigured()) return getSupabaseFallbackState();
  await ensureSchema();
  const result = await db.execute(sql`
    select id, source_label, source_type, observed_at, updated_at, payload
    from business_world_state
    where id = 'primary'
    limit 1
  `);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return getSupabaseFallbackState();
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
        sourceMode: state.sourceType === "simulated" ? ("simulated" as const) : ("persisted-observation" as const),
        provider: state.sourceType,
        sourceLabel: state.sourceLabel,
        asOf: state.observedAt,
        updatedAt: state.updatedAt,
        storage: isDatabaseConfigured() && state.sourceType !== "system-record" ? "Primary Postgres" : "Supabase Postgres",
        writable: isDatabaseConfigured(),
      }
    : {
        sourceMode: "unavailable" as const,
        provider: "none",
        sourceLabel: "Verified source unavailable",
        asOf: null,
        updatedAt: null,
        storage: "unavailable",
        writable: false,
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
  if (isDatabaseConfigured()) {
    await db.execute(sql`
      insert into business_world_scenario_run
        (id, prompt, lever, change_percent, baseline, result, source_state_id)
      values
        (${id}, ${parsed.prompt}, ${parsed.lever}, ${parsed.changePercent}, ${JSON.stringify(state?.payload ?? null)}::jsonb, ${JSON.stringify(result)}::jsonb, ${state?.id ?? null})
    `);
  } else {
    const response = await fetch(SUPABASE_SCENARIO_ENDPOINT, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id,
        prompt: parsed.prompt,
        lever: parsed.lever,
        change_percent: parsed.changePercent,
        baseline: state?.payload ?? null,
        result,
        source_state_id: state?.id ?? null,
      }),
    });
    if (!response.ok) throw new Error(`Supabase Scenario persistence failed: ${response.status}`);
  }
  return { id, provenance: provenance(state), result };
}
