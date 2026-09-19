import { createRequire } from "node:module";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const nodeRequire = createRequire(import.meta.url);

type CedarModule = {
  getCedarVersion: () => string;
  isAuthorized: (call: {
    principal: { type: string; id: string };
    action: { type: string; id: string };
    resource: { type: string; id: string };
    context: Record<string, unknown>;
    policies: { staticPolicies: string };
    entities: unknown[];
  }) =>
    | {
        type: "success";
        response: {
          decision: "allow" | "deny";
          diagnostics: { reason: string[] };
        };
      }
    | {
        type: "failure";
        errors: Array<{ message: string }>;
      };
};

const staticPolicies = `permit (
  principal,
  action == CedarDemo::Action::"Select",
  resource == CedarDemo::Database::"mock_analytics"
);

forbid (
  principal,
  action == CedarDemo::Action::"Delete",
  resource == CedarDemo::Database::"mock_analytics"
);`;

const safeRows = [
  { campaign: "秋季拉新", channel: "Douyin", spend: 68240, revenue: 318760, roas: 4.67 },
  { campaign: "新手家庭", channel: "Xiaohongshu", spend: 54120, revenue: 221580, roas: 4.09 },
  { campaign: "会员复购", channel: "WeChat", spend: 39480, revenue: 177210, roas: 4.49 },
  { campaign: "夜用挑战", channel: "Douyin", spend: 48600, revenue: 168420, roas: 3.47 },
  { campaign: "大促召回", channel: "Tmall", spend: 71120, revenue: 243910, roas: 3.43 },
];

function cedar(): CedarModule {
  return nodeRequire("@cedar-policy/cedar-wasm/nodejs") as CedarModule;
}

function classify(sql: string): "Select" | "Delete" | "Other" {
  const first = sql.trim().match(/^([A-Za-z]+)/)?.[1]?.toUpperCase();
  if (first === "SELECT" || first === "WITH") return "Select";
  if (first === "DELETE") return "Delete";
  return "Other";
}

function evaluateSql(sql: string) {
  const engine = cedar();
  const action = classify(sql);
  const result = engine.isAuthorized({
    principal: { type: "CedarDemo::Analyst", id: "demo-analyst" },
    action: { type: "CedarDemo::Action", id: action },
    resource: { type: "CedarDemo::Database", id: "mock_analytics" },
    context: {},
    policies: { staticPolicies },
    entities: [],
  });
  const version = engine.getCedarVersion();

  if (result.type === "failure") {
    return {
      ok: false,
      executed: false,
      rows: [],
      cedar: {
        decision: "ERROR" as const,
        action,
        version,
        message: result.errors.map((error) => error.message).join("; "),
      },
      runtime: { scannedRows: 0, elapsedMs: 0, role: "analyst_readonly" },
    };
  }

  const decision = result.response.decision.toUpperCase() as "ALLOW" | "DENY";
  if (decision !== "ALLOW") {
    return {
      ok: true,
      executed: false,
      rows: [],
      cedar: {
        decision: "DENY" as const,
        action,
        version,
        determiningPolicies: result.response.diagnostics.reason,
      },
      runtime: { scannedRows: 0, elapsedMs: 2, role: "analyst_readonly" },
    };
  }

  return {
    ok: true,
    executed: true,
    rows: safeRows,
    cedar: {
      decision: "ALLOW" as const,
      action,
      version,
      determiningPolicies: result.response.diagnostics.reason,
    },
    runtime: { scannedRows: 42813, elapsedMs: 428, role: "analyst_readonly" },
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { sql?: unknown } | null;
  if (!body || typeof body.sql !== "string" || !body.sql.trim()) {
    return NextResponse.json({ error: "sql is required" }, { status: 400 });
  }

  const result = evaluateSql(body.sql);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET() {
  const select = evaluateSql("SELECT campaign FROM analytics.campaign_daily LIMIT 1;");
  const remove = evaluateSql("DELETE FROM analytics.campaign_daily WHERE date < '2026-01-01';");
  const pass =
    select.cedar.decision === "ALLOW" &&
    select.executed === true &&
    remove.cedar.decision === "DENY" &&
    remove.executed === false;

  return NextResponse.json({
    pass,
    cedarVersion: select.cedar.version,
    select: {
      decision: select.cedar.decision,
      action: select.cedar.action,
      executed: select.executed,
      determiningPolicies: "determiningPolicies" in select.cedar ? select.cedar.determiningPolicies : [],
    },
    delete: {
      decision: remove.cedar.decision,
      action: remove.cedar.action,
      executed: remove.executed,
      determiningPolicies: "determiningPolicies" in remove.cedar ? remove.cedar.determiningPolicies : [],
    },
    trustBoundary: "Natural-language to SQL is not formally proven.",
  });
}
