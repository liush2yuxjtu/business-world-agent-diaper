import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { z } from "zod";
import { emptyState, normalizeState, createSnapshot, calculateScenario, createReport, makeId, METRICS } from "@/public/business-world/src/ui-state.mjs";

export class BusinessWorldError extends Error {
  constructor(public readonly code: "authentication-required" | "unavailable" | "conflict" | "invalid-input" | "baseline-required" | "not-found") {
    super({"authentication-required":"请先登录。",unavailable:"暂时无法读取或保存工作区，请稍后重试。",conflict:"工作区已有更新，请刷新后重新确认。","invalid-input":"请检查必填项与数值范围。","baseline-required":"请先添加经营记录。","not-found":"未找到所选记录，请刷新后重试。"}[code]);
  }
}
export type UserState = {
  schemaVersion: number;
  snapshot: ReturnType<typeof createSnapshot> | null;
  scenarios: Array<ReturnType<typeof calculateScenario>>;
  reports: Array<ReturnType<typeof createReport>>;
  drafts: Array<{id:string;title:string;body:string;kind:string;createdAt:string}>;
  selectedReportId: string | null;
};
export type WorkspaceEnvelope = {workspaceId: string; revision: number; updatedAt: string | null; state: UserState};
export function workspaceOwner(userId: string): string {
  if(typeof userId!=="string"||!userId.trim()||userId.length>200)throw new BusinessWorldError("authentication-required");
  return createHash("sha256").update("business-world:user:"+userId).digest("hex");
}
function ownerKey(owner: string) {
  if(!/^[a-f0-9]{64}$/.test(owner))throw new BusinessWorldError("authentication-required");
  return owner;
}
const metricSchema = z.strictObject(Object.fromEntries(Object.entries(METRICS).map(([key,rule])=>[key,('integer' in rule&&rule.integer)?z.number().finite().int().min(0).max(rule.max):z.number().finite().min(0).max(rule.max)])));
const label=z.string().trim().min(1).max(120);
export const workspaceCommandSchema = z.discriminatedUnion("kind",[
  z.strictObject({kind:z.literal("save-snapshot"),name:label,notes:z.string().max(2000),metrics:metricSchema}),
  z.strictObject({kind:z.literal("run-scenario"),lever:z.enum(["ad_efficiency","checkout_conversion","content_engagement","repeat_purchase"]),change:z.number().finite().min(-95).max(100),prompt:z.string().trim().min(1).max(500)}),
  z.strictObject({kind:z.literal("create-report"),title:label,scenarioId:z.string().max(100).nullable()}),
  z.strictObject({kind:z.literal("save-note"),reportId:z.string().min(1).max(100),note:z.string().max(4000)}),
  z.strictObject({kind:z.literal("select-report"),reportId:z.string().min(1).max(100)}),
  z.strictObject({kind:z.literal("save-draft"),title:label,body:z.string().trim().min(1).max(4000),draftKind:z.enum(["task","brief","plan","email"])}),
]);
export const workspaceWriteSchema=z.strictObject({expectedRevision:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER-1),command:workspaceCommandSchema});

let sqlite: import("node:sqlite").DatabaseSync | null = null;
let sqlitePath: string | null = null;
async function sqliteStore() {
  const path=process.env.BUSINESS_WORLD_SQLITE_PATH?.trim();
  // SQLite is an explicit self-hosted durable-volume option, never a serverless fallback.
  if(!path||!isAbsolute(path)||process.env.VERCEL==="1")throw new BusinessWorldError("unavailable");
  if(sqlite&&sqlitePath!==path)throw new BusinessWorldError("unavailable");
  if(!sqlite){
    const { DatabaseSync }=await import("node:sqlite");
    mkdirSync(dirname(path),{recursive:true,mode:0o700});
    sqlite=new DatabaseSync(path,{timeout:10000});sqlitePath=path;
    sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000; CREATE TABLE IF NOT EXISTS business_world_workspace (owner_id TEXT PRIMARY KEY, revision INTEGER NOT NULL, state TEXT NOT NULL, updated_at TEXT NOT NULL)");
  }
  return sqlite;
}
function storeKind(): "sqlite" | "postgres" {
  const local=Boolean(process.env.BUSINESS_WORLD_SQLITE_PATH?.trim()),remote=Boolean(process.env.DATABASE_URL?.trim());
  // Ambiguous configuration is a failure, not permission to read a different database.
  if(local&&remote)throw new BusinessWorldError("unavailable");
  if(local)return "sqlite";
  if(remote)return "postgres";
  throw new BusinessWorldError("unavailable");
}
function envelope(owner: string,row?: {revision: unknown; state: unknown; updated_at: unknown}): WorkspaceEnvelope {
  return row?{workspaceId:owner,revision:Number(row.revision),updatedAt:new Date(String(row.updated_at)).toISOString(),state:normalizeState(typeof row.state==="string"?JSON.parse(row.state):row.state)}:{workspaceId:owner,revision:0,updatedAt:null,state:emptyState()};
}
export async function readWorkspace(owner: string): Promise<WorkspaceEnvelope> {
  ownerKey(owner);
  try{
    if(storeKind()==="postgres"){
      const {readPostgresWorkspace}=await import("./workspace-postgres");
      return envelope(owner,await readPostgresWorkspace(owner));
    }
    const db=await sqliteStore();
    return envelope(owner,db.prepare("SELECT revision,state,updated_at FROM business_world_workspace WHERE owner_id=?").get(owner) as {revision:unknown;state:unknown;updated_at:unknown}|undefined);
  }catch(error){if(error instanceof BusinessWorldError)throw error;throw new BusinessWorldError("unavailable");}
}
export async function mutateWorkspace(owner: string,raw: unknown): Promise<WorkspaceEnvelope> {
  ownerKey(owner);
  const parsed=workspaceWriteSchema.safeParse(raw);
  if(!parsed.success)throw new BusinessWorldError("invalid-input");
  const {expectedRevision,command}=parsed.data;
  const current=await readWorkspace(owner);
  if(current.revision!==expectedRevision)throw new BusinessWorldError("conflict");
  const state=structuredClone(current.state);
  try{
    switch(command.kind){
      case "save-snapshot":state.snapshot=createSnapshot(command.name,command.notes,command.metrics);break;
      case "run-scenario":{
        if(!state.snapshot)throw new BusinessWorldError("baseline-required");
        const run=calculateScenario(state.snapshot,command.lever,command.change,command.prompt);
        state.scenarios=[run,...state.scenarios].slice(0,50);break;
      }
      case "create-report":{
        const scenario=command.scenarioId?state.scenarios.find((r:{id:string})=>r.id===command.scenarioId):null;
        if(command.scenarioId&&!scenario)throw new BusinessWorldError("not-found");
        if(!state.snapshot&&!scenario)throw new BusinessWorldError("baseline-required");
        const report=createReport(command.title,state.snapshot,scenario??null);
        state.reports=[report,...state.reports].slice(0,50);state.selectedReportId=report.id;break;
      }
      case "save-note":{
        const report=state.reports.find((r:{id:string})=>r.id===command.reportId);
        if(!report)throw new BusinessWorldError("not-found");report.note=command.note;break;
      }
      case "select-report":{
        if(!state.reports.some((r:{id:string})=>r.id===command.reportId))throw new BusinessWorldError("not-found");state.selectedReportId=command.reportId;break;
      }
      case "save-draft":state.drafts=[{id:makeId(),title:command.title,body:command.body,kind:command.draftKind,createdAt:new Date().toISOString()},...state.drafts].slice(0,50);break;
    }
    const normalized=normalizeState(state),now=new Date().toISOString();
    if(storeKind()==="postgres"){
      const {writePostgresWorkspace}=await import("./workspace-postgres");
      const row=await writePostgresWorkspace(owner,expectedRevision,normalized,now);
      if(!row)throw new BusinessWorldError("conflict");return envelope(owner,row);
    }
    const db=await sqliteStore();
    const row=db.prepare("INSERT INTO business_world_workspace(owner_id,revision,state,updated_at) VALUES(?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET revision=excluded.revision,state=excluded.state,updated_at=excluded.updated_at WHERE business_world_workspace.revision=? RETURNING revision,state,updated_at").get(owner,expectedRevision+1,JSON.stringify(normalized),now,expectedRevision) as {revision:unknown;state:unknown;updated_at:unknown}|undefined;
    if(!row)throw new BusinessWorldError("conflict");return envelope(owner,row);
  }catch(error){if(error instanceof BusinessWorldError)throw error;if(error&&typeof error==="object"&&"code" in error&&String(error.code).startsWith("invalid-"))throw new BusinessWorldError("invalid-input");throw new BusinessWorldError("unavailable");}
}
