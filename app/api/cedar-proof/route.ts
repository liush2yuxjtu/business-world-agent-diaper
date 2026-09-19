import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

function classify(sql: string): "Select" | "Delete" | "Other" {
  const first = sql.trim().match(/^([A-Za-z]+)/)?.[1]?.toUpperCase();
  if (first === "SELECT" || first === "WITH") return "Select";
  if (first === "DELETE") return "Delete";
  return "Other";
}

async function authorize(action: "Select" | "Delete" | "Other") {
  const cedar = await import("@cedar-policy/cedar-wasm/nodejs");
  const result = cedar.isAuthorized({
    principal: { type: "CedarDemo::Analyst", id: "demo-analyst" },
    action: { type: "CedarDemo::Action", id: action },
    resource: { type: "CedarDemo::Database", id: "mock_analytics" },
    context: {},
    policies: { staticPolicies },
    entities: [],
  });

  return {
    result,
    version: cedar.getCedarVersion(),
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { sql?: unknown } | null;
  if (!body || typeof body.sql !== "string" || !body.sql.trim()) {
    return NextResponse.json({ error: "sql is required" }, { status: 400 });
  }

  const action = classify(body.sql);
  const { result, version } = await authorize(action);

  if (result.type === "failure") {
    return NextResponse.json({
      ok: false,
      executed: false,
      cedar: {
        decision: "ERROR",
        action,
        version,
        message: result.errors.map((error) => error.message).join("; "),
      },
    }, { status: 500 });
  }

  const decision = result.response.decision.toUpperCase();
  const determiningPolicies = result.response.diagnostics.reason;

  if (decision !== "ALLOW") {
    return NextResponse.json({
      ok: true,
      executed: false,
      rows: [],
      cedar: {
        decision: "DENY",
        action,
        version,
        determiningPolicies,
      },
      runtime: { scannedRows: 0, elapsedMs: 2, role: "analyst_readonly" },
    });
  }

  return NextResponse.json({
    ok: true,
    executed: true,
    rows: safeRows,
    cedar: {
      decision: "ALLOW",
      action,
      version,
      determiningPolicies,
    },
    runtime: { scannedRows: 42813, elapsedMs: 428, role: "analyst_readonly" },
  });
}
