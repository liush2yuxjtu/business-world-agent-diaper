"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  FileCode2,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  XCircle,
} from "lucide-react";

const safeSql = `SELECT
  campaign,
  channel,
  SUM(spend) AS spend,
  SUM(revenue) AS revenue,
  ROUND(SUM(revenue) / NULLIF(SUM(spend), 0), 2) AS roas
FROM analytics.campaign_daily
WHERE date >= '2026-09-01'
  AND country = 'JP'
GROUP BY campaign, channel
ORDER BY revenue DESC
LIMIT 50;`;

const dangerSql = `DELETE FROM analytics.campaign_daily
WHERE date < '2026-01-01';`;

const cedarPolicy = `permit (
  principal,
  action == CedarDemo::Action::"Select",
  resource == CedarDemo::Database::"mock_analytics"
);

forbid (
  principal,
  action == CedarDemo::Action::"Delete",
  resource == CedarDemo::Database::"mock_analytics"
);`;

const leanProof = `inductive SqlAction where
  | select
  | delete
  | other
  deriving DecidableEq

def cedarAllows : SqlAction → Bool
  | .select => true
  | .delete => false
  | .other => false

theorem read_only_policy_sound
    (action : SqlAction)
    (h : cedarAllows action = true) :
    action = .select := by
  cases action <;> simp [cedarAllows] at h ⊢`;

const fallbackRows = [
  { campaign: "秋季拉新", channel: "Douyin", spend: 68240, revenue: 318760, roas: 4.67 },
  { campaign: "新手家庭", channel: "Xiaohongshu", spend: 54120, revenue: 221580, roas: 4.09 },
  { campaign: "会员复购", channel: "WeChat", spend: 39480, revenue: 177210, roas: 4.49 },
  { campaign: "夜用挑战", channel: "Douyin", spend: 48600, revenue: 168420, roas: 3.47 },
  { campaign: "大促召回", channel: "Tmall", spend: 71120, revenue: 243910, roas: 3.43 },
];

const tables = [
  ["campaign_daily", "24 columns", "42.8k"],
  ["customers", "18 columns", "186k"],
  ["orders", "31 columns", "1.24m"],
  ["products", "15 columns", "3.2k"],
];

type RunResponse = {
  ok: boolean;
  executed: boolean;
  rows?: typeof fallbackRows;
  cedar?: {
    decision: "ALLOW" | "DENY" | "ERROR";
    action: string;
    determiningPolicies?: string[];
    message?: string;
  };
  runtime?: {
    scannedRows: number;
    elapsedMs: number;
    role: string;
  };
};

export default function CedarProofAfter() {
  const [sql, setSql] = useState(safeSql);
  const [response, setResponse] = useState<RunResponse>({
    ok: true,
    executed: true,
    rows: fallbackRows,
    cedar: { decision: "ALLOW", action: "Select", determiningPolicies: ["policy0"] },
    runtime: { scannedRows: 42813, elapsedMs: 428, role: "analyst_readonly" },
  });
  const [running, setRunning] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [ranAt, setRanAt] = useState("10:42:17");

  const rows = response.rows ?? [];
  const maxRevenue = useMemo(
    () => Math.max(1, ...rows.map((r) => r.revenue)),
    [rows],
  );

  async function runQuery() {
    setRunning(true);
    try {
      const res = await fetch("/api/cedar-proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = (await res.json()) as RunResponse;
      setResponse(data);
      setRanAt(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    } finally {
      setRunning(false);
    }
  }

  const decision = response.cedar?.decision ?? "ERROR";
  const allowed = decision === "ALLOW";

  return (
    <main style={s.shell}>
      <header style={s.topbar}>
        <div style={s.brand}>
          <div style={s.logo}><BarChart3 size={18}/></div>
          <strong>Northstar Analytics</strong>
          <span style={s.muted}>/</span>
          <span>Campaign performance</span>
        </div>
        <div style={s.headerActions}>
          <span style={s.enforced}><ShieldCheck size={13}/> Cedar enforced</span>
          <span style={s.pill}>AFTER · verified execution</span>
          <span style={s.avatar}>LS</span>
        </div>
      </header>

      <div style={s.body}>
        <aside style={s.sidebar}>
          <div style={s.sideTitle}>DATA</div>
          <div style={s.search}><Search size={14}/><span>Search tables</span></div>
          <div style={s.source}><Database size={15}/><strong>mock_analytics</strong><ChevronDown size={14}/></div>
          <div style={s.treeLabel}>analytics</div>
          {tables.map(([name, cols, count], i) => (
            <div key={name} style={{...s.tableItem, ...(i === 0 ? s.tableActive : {})}}>
              <Table2 size={14}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:650,color:"#202124"}}>{name}</div>
                <div style={s.tableMeta}>{cols} · {count} rows</div>
              </div>
            </div>
          ))}
          <div style={s.sideDivider}/>
          <div style={s.sideTitle}>SAVED QUERIES</div>
          <button style={s.savedButton} onClick={()=>setSql(safeSql)}>Weekly ROAS review</button>
          <button style={s.savedButton} onClick={()=>setSql(dangerSql)}>Cleanup old rows · risky</button>
          <div style={s.saved}>Customer cohorts</div>
        </aside>

        <section style={s.workspace}>
          <div style={s.tabs}>
            <div style={s.tabActive}>Query 1</div>
            <div style={s.tab}>+ New query</div>
          </div>

          <div style={s.editorHeader}>
            <div>
              <div style={s.crumb}>mock_analytics / analytics</div>
              <div style={s.queryTitle}>Campaign revenue & ROAS — Japan</div>
            </div>
            <div style={s.editorActions}>
              <button style={s.secondary}><Sparkles size={14}/> Ask AI</button>
              <button style={s.secondary} onClick={()=>setProofOpen(!proofOpen)}><FileCode2 size={14}/> {proofOpen ? "Hide proof" : "Proof"}</button>
              <button style={s.run} onClick={runQuery} disabled={running}>
                <Play size={14} fill="currentColor"/> {running ? "Checking…" : "Run"}
              </button>
            </div>
          </div>

          <div style={s.editorWrap}>
            <div style={s.lineNumbers}>1{"\n"}2{"\n"}3{"\n"}4{"\n"}5{"\n"}6{"\n"}7{"\n"}8{"\n"}9{"\n"}10{"\n"}11{"\n"}12</div>
            <textarea value={sql} onChange={(e)=>setSql(e.target.value)} spellCheck={false} style={s.editor}/>
          </div>

          <div style={s.guardrail}>
            <div style={{...s.decisionDot, background: allowed ? "#dff8ec" : "#fee8e7", color: allowed ? "#067647" : "#b42318"}}>
              {allowed ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
            </div>
            <div style={{flex:1}}>
              <div style={s.guardTitle}>Cedar decision: <span style={{color:allowed?"#067647":"#b42318"}}>{decision}</span></div>
              <div style={s.guardSub}>
                action={response.cedar?.action ?? "unknown"} · policy={response.cedar?.determiningPolicies?.join(", ") || "default deny"} · execution={response.executed ? "continued" : "stopped before DB"}
              </div>
            </div>
            <button style={s.evidenceButton} onClick={()=>setProofOpen(true)}>View evidence</button>
          </div>

          {proofOpen && (
            <div style={s.proofGrid}>
              <div>
                <div style={s.proofLabel}>CEDAR POLICY · runtime</div>
                <pre style={s.proofCode}>{cedarPolicy}</pre>
              </div>
              <div>
                <div style={s.proofLabel}>LEAN · rule-level proof</div>
                <pre style={s.proofCode}>{leanProof}</pre>
              </div>
              <div style={s.boundary}>
                <strong>Trust boundary</strong>
                <span>✓ Cedar runtime gates SQL before execution</span>
                <span>✓ Lean source proves the demo rule “allowed ⇒ SELECT”</span>
                <span>⚠ Natural language → SQL interpretation is not formally proven</span>
              </div>
            </div>
          )}

          <div style={s.resultHeader}>
            <div style={s.resultTabs}>
              <strong style={s.resultTabActive}>Results</strong>
              <span style={s.resultTab}>Chart</span>
              <span style={s.resultTab}>Query details</span>
            </div>
            <div style={s.runtime}><Clock3 size={13}/> {response.runtime?.elapsedMs ?? 0} ms · {rows.length} rows · ran {ranAt}</div>
          </div>

          <div style={s.grid}>
            <div style={s.tablePanel}>
              {response.executed ? (
                <table style={s.dataTable}>
                  <thead><tr><th>campaign</th><th>channel</th><th style={s.num}>spend</th><th style={s.num}>revenue</th><th style={s.num}>roas</th></tr></thead>
                  <tbody>
                    {rows.map((r) => <tr key={r.campaign}>
                      <td>{r.campaign}</td><td><span style={s.channel}>{r.channel}</span></td>
                      <td style={s.num}>¥{r.spend.toLocaleString()}</td>
                      <td style={s.num}>¥{r.revenue.toLocaleString()}</td>
                      <td style={s.num}><strong>{r.roas.toFixed(2)}</strong></td>
                    </tr>)}
                  </tbody>
                </table>
              ) : (
                <div style={s.blocked}>
                  <ShieldCheck size={28}/>
                  <strong>Query was not executed</strong>
                  <span>Cedar denied this mutation before the database call. Mock data remains unchanged.</span>
                </div>
              )}
            </div>

            <aside style={s.chartPanel}>
              <div style={s.chartTitle}>Revenue by campaign</div>
              <div style={s.chartSub}>{response.executed ? "Current query result" : "No execution result"}</div>
              <div style={s.bars}>
                {rows.map((r) => (
                  <div key={r.campaign} style={s.barRow}>
                    <div style={s.barLabel}>{r.campaign}</div>
                    <div style={s.barTrack}><div style={{...s.bar,width:`${Math.round((r.revenue/maxRevenue)*100)}%`}}/></div>
                    <div style={s.barValue}>¥{Math.round(r.revenue/1000)}k</div>
                  </div>
                ))}
              </div>
              <div style={s.detailCard}>
                <div style={s.detailLabel}>Execution receipt</div>
                <div style={s.detailGrid}>
                  <span>Warehouse</span><b>mock_analytics</b>
                  <span>Role</span><b>{response.runtime?.role ?? "analyst_readonly"}</b>
                  <span>Cedar</span><b style={{color:allowed?"#067647":"#b42318"}}>{decision}</b>
                  <span>DB touched</span><b>{response.executed ? "read-only" : "no"}</b>
                  <span>Scanned</span><b>{response.runtime?.scannedRows?.toLocaleString() ?? 0} rows</b>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  shell:{minHeight:"100vh",background:"#f7f8fa",color:"#202124",fontFamily:"Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"},
  topbar:{height:58,background:"#fff",borderBottom:"1px solid #e6e8eb",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px"},
  brand:{display:"flex",alignItems:"center",gap:9,fontSize:14},
  logo:{width:30,height:30,borderRadius:8,display:"grid",placeItems:"center",background:"#111827",color:"#fff"},
  muted:{color:"#a4a7ad"},headerActions:{display:"flex",alignItems:"center",gap:10},
  enforced:{fontSize:11,fontWeight:750,padding:"6px 9px",borderRadius:999,color:"#067647",background:"#ecfdf3",display:"flex",alignItems:"center",gap:5},
  pill:{fontSize:11,fontWeight:700,letterSpacing:.7,padding:"6px 9px",border:"1px solid #dfe2e7",borderRadius:999,color:"#667085",background:"#fff"},
  avatar:{width:30,height:30,borderRadius:999,display:"grid",placeItems:"center",fontSize:11,fontWeight:800,background:"#e8eefc",color:"#3156a3"},
  body:{display:"grid",gridTemplateColumns:"238px minmax(0,1fr)",minHeight:"calc(100vh - 58px)"},
  sidebar:{background:"#fbfbfc",borderRight:"1px solid #e4e6ea",padding:"16px 12px"},
  sideTitle:{fontSize:10,fontWeight:800,letterSpacing:1.2,color:"#8b9099",margin:"4px 8px 10px"},
  search:{height:34,border:"1px solid #dfe2e7",borderRadius:7,display:"flex",alignItems:"center",gap:8,padding:"0 9px",fontSize:12,color:"#8b9099",background:"#fff"},
  source:{display:"flex",alignItems:"center",gap:7,padding:"14px 8px 8px",fontSize:13},
  treeLabel:{fontSize:11,fontWeight:700,color:"#8b9099",padding:"6px 8px"},
  tableItem:{display:"flex",gap:8,padding:"8px",borderRadius:7,fontSize:12,alignItems:"flex-start",color:"#6b7280",marginBottom:2},
  tableActive:{background:"#eef2ff",color:"#4056a1"},
  tableMeta:{fontSize:10,color:"#9aa0aa",marginTop:2},
  sideDivider:{height:1,background:"#e7e9ed",margin:"16px 8px"},
  saved:{fontSize:12,padding:"7px 8px",color:"#5f6368"},
  savedButton:{display:"block",width:"100%",textAlign:"left",border:0,background:"transparent",fontSize:12,padding:"7px 8px",color:"#5f6368",cursor:"pointer"},
  workspace:{minWidth:0,padding:"0 18px 24px"},
  tabs:{height:46,display:"flex",alignItems:"end",gap:18,borderBottom:"1px solid #e0e3e7"},
  tabActive:{padding:"0 4px 11px",fontSize:12,fontWeight:700,borderBottom:"2px solid #4f63d8"},
  tab:{padding:"0 4px 11px",fontSize:12,color:"#8a8f98"},
  editorHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0 12px"},
  crumb:{fontSize:11,color:"#8a9099",marginBottom:5},
  queryTitle:{fontSize:18,fontWeight:720,letterSpacing:"-.2px"},
  editorActions:{display:"flex",gap:8},
  secondary:{height:34,padding:"0 12px",borderRadius:7,border:"1px solid #d9dce2",background:"#fff",display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:650,color:"#4a4f58",cursor:"pointer"},
  run:{height:34,padding:"0 14px",borderRadius:7,border:0,background:"#4f63d8",color:"#fff",display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:750,cursor:"pointer"},
  editorWrap:{height:252,border:"1px solid #dfe2e6",background:"#fff",borderRadius:9,display:"grid",gridTemplateColumns:"42px 1fr",overflow:"hidden",boxShadow:"0 1px 2px rgba(16,24,40,.03)"},
  lineNumbers:{padding:"14px 10px",whiteSpace:"pre",textAlign:"right",lineHeight:1.62,fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace",fontSize:12,color:"#b0b4bb",background:"#fafbfc",borderRight:"1px solid #edf0f2"},
  editor:{border:0,resize:"none",outline:"none",padding:14,fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace",fontSize:12.5,lineHeight:1.62,color:"#263238",background:"#fff"},
  guardrail:{marginTop:10,display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"1px solid #dde1e6",borderRadius:8,background:"#fff"},
  decisionDot:{width:30,height:30,borderRadius:999,display:"grid",placeItems:"center"},
  guardTitle:{fontSize:12,fontWeight:750},guardSub:{fontSize:10.5,color:"#7e858f",marginTop:2},
  evidenceButton:{fontSize:11,fontWeight:700,border:"1px solid #d9dde3",background:"#fff",borderRadius:6,padding:"6px 9px",cursor:"pointer"},
  proofGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10,padding:12,border:"1px solid #dfe2e6",borderRadius:9,background:"#f8fafc"},
  proofLabel:{fontSize:10,fontWeight:800,letterSpacing:1,color:"#7d8490",marginBottom:6},
  proofCode:{margin:0,whiteSpace:"pre-wrap",overflowX:"auto",background:"#111827",color:"#e8edf5",padding:12,borderRadius:7,fontSize:10.5,lineHeight:1.55,maxHeight:230},
  boundary:{gridColumn:"1 / -1",display:"flex",gap:12,flexWrap:"wrap",fontSize:10.5,color:"#667085",paddingTop:2},
  resultHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",height:46,borderBottom:"1px solid #e1e4e8",marginTop:8},
  resultTabs:{display:"flex",gap:22,height:"100%",alignItems:"end"},
  resultTabActive:{height:"100%",display:"flex",alignItems:"center",fontSize:12,borderBottom:"2px solid #4f63d8"},
  resultTab:{height:"100%",display:"flex",alignItems:"center",fontSize:12,color:"#7c828c"},
  runtime:{fontSize:11,color:"#848a93",display:"flex",alignItems:"center",gap:5},
  grid:{display:"grid",gridTemplateColumns:"minmax(0,1fr) 330px",gap:14,paddingTop:14},
  tablePanel:{background:"#fff",border:"1px solid #dfe2e6",borderRadius:9,overflow:"auto",minHeight:260},
  dataTable:{width:"100%",borderCollapse:"collapse",fontSize:12},
  num:{textAlign:"right"},
  channel:{padding:"3px 7px",borderRadius:999,background:"#f1f3f6",fontSize:11},
  blocked:{height:250,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,color:"#667085",textAlign:"center",padding:30,fontSize:12},
  chartPanel:{background:"#fff",border:"1px solid #dfe2e6",borderRadius:9,padding:16},
  chartTitle:{fontSize:13,fontWeight:750},chartSub:{fontSize:11,color:"#9297a0",marginTop:3},
  bars:{display:"grid",gap:12,marginTop:18},
  barRow:{display:"grid",gridTemplateColumns:"72px 1fr 44px",gap:7,alignItems:"center"},
  barLabel:{fontSize:10.5,color:"#5f6570",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  barTrack:{height:8,borderRadius:999,background:"#eef0f4",overflow:"hidden"},
  bar:{height:"100%",borderRadius:999,background:"#6a7ce6"},
  barValue:{fontSize:10.5,textAlign:"right",color:"#60656f"},
  detailCard:{marginTop:20,borderTop:"1px solid #e8eaed",paddingTop:14,fontSize:12},
  detailLabel:{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"#999ea7",marginBottom:4},
  detailGrid:{display:"grid",gridTemplateColumns:"1fr auto",rowGap:7,marginTop:12,color:"#8a9099",fontSize:11},
};
