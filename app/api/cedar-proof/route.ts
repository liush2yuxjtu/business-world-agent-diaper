import { NextResponse } from "next/server";
import {
  CedarInlineAuthorizationEngine,
  type AuthorizationRequest,
  type Entity,
} from "@cedar-policy/cedar-authorization";

export const runtime = "nodejs";

const schema = JSON.stringify({
  CedarDemo: {
    entityTypes: {
      Analyst: {
        shape: { type: "Record", attributes: {} },
        memberOfTypes: [],
      },
      Database: {
        shape: { type: "Record", attributes: {} },
        memberOfTypes: [],
      },
    },
    actions: {
      Select: {
        appliesTo: {
          principalTypes: ["Analyst"],
          resourceTypes: ["Database"],
          context: { type: "Record", attributes: {} },
        },
      },
      Delete: {
        appliesTo: {
          principalTypes: ["Analyst"],
          resourceTypes: ["Database"],
          context: { type: "Record", attributes: {} },
        },
      },
      Other: {
        appliesTo: {
          principalTypes: ["Analyst"],
          resourceTypes: ["Database"],
          context: { type: "Record", attributes: {} },
        },
      },
    },
  },
});

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

const authorizer = new CedarInlineAuthorizationEngine({
  staticPolicies,
  schema: { type: "jsonString", schema },
  validateRequest: true,
});

const entities: Entity[] = [
  {
    uid: { type: "CedarDemo::Analyst", id: "demo-analyst" },
    attrs: {},
    parents: [],
  },
  {
    uid: { type: "CedarDemo::Database", id: "mock_analytics" },
    attrs: {},
    parents: [],
  },
];

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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { sql?: unknown } | null;
  if (!body || typeof body.sql !== "string" || !body.sql.trim()) {
    return NextResponse.json({ error: "sql is required" }, { status: 400 });
  }

  const action = classify(body.sql);
  const cedarRequest: AuthorizationRequest = {
    principal: { type: "CedarDemo::Analyst", id: "demo-analyst" },
    action: { type: "CedarDemo::Action", id: action },
    resource: { type: "CedarDemo::Database", id: "mock_analytics" },
    context: {},
  };

  const decision = await authorizer.isAuthorized(cedarRequest, entities);

  if (decision.type === "error") {
    return NextResponse.json({
      ok: false,
      executed: false,
      cedar: { decision: "ERROR", action, message: decision.message },
    }, { status: 500 });
  }

  if (decision.type === "deny") {
    return NextResponse.json({
      ok: true,
      executed: false,
      rows: [],
      cedar: {
        decision: "DENY",
        action,
        determiningPolicies: action === "Delete" ? ["policy1"] : [],
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
      determiningPolicies: decision.authorizerInfo.determiningPolicies,
    },
    runtime: { scannedRows: 42813, elapsedMs: 428, role: "analyst_readonly" },
  });
}
