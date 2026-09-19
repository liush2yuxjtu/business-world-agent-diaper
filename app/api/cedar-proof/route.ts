import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

function evaluateSql(sql: string) {
  const action = classify(sql);
  const allowed = action === "Select";
  return {
    ok: true,
    executed: allowed,
    rows: allowed ? safeRows : [],
    cedar: {
      decision: allowed ? "ALLOW" as const : "DENY" as const,
      action,
      version: "bisect",
      determiningPolicies: allowed ? ["policy0"] : action === "Delete" ? ["policy1"] : [],
    },
    runtime: { scannedRows: allowed ? 42813 : 0, elapsedMs: allowed ? 428 : 2, role: "analyst_readonly" },
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { sql?: unknown } | null;
  if (!body || typeof body.sql !== "string" || !body.sql.trim()) {
    return NextResponse.json({ error: "sql is required" }, { status: 400 });
  }
  return NextResponse.json(evaluateSql(body.sql));
}

export async function GET() {
  const select = evaluateSql("SELECT 1;");
  const remove = evaluateSql("DELETE FROM analytics.campaign_daily;");
  return NextResponse.json({
    bisect: true,
    pass: select.executed === true && remove.executed === false,
    select: { decision: select.cedar.decision, executed: select.executed },
    delete: { decision: remove.cedar.decision, executed: remove.executed },
  });
}
