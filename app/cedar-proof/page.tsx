"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Clock3,
  Database,
  Play,
  Search,
  Sparkles,
  Table2,
} from "lucide-react";

const defaultSql = `SELECT
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

const rows = [
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

export default function CedarProofBefore() {
  const [sql, setSql] = useState(defaultSql);
  const [ranAt, setRanAt] = useState("10:42:17");
  const maxRevenue = useMemo(() => Math.max(...rows.map((r) => r.revenue)), []);

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
          <span style={s.pill}>BEFORE · analyst workbench</span>
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
          <div style={s.saved}>Weekly ROAS review</div>
          <div style={s.saved}>Customer cohorts</div>
          <div style={s.saved}>Product margin watch</div>
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
              <button
                style={s.run}
                onClick={() => setRanAt(new Date().toLocaleTimeString("en-GB", {hour12:false}))}
              >
                <Play size={14} fill="currentColor"/> Run
              </button>
            </div>
          </div>

          <div style={s.editorWrap}>
            <div style={s.lineNumbers}>1{"\n"}2{"\n"}3{"\n"}4{"\n"}5{"\n"}6{"\n"}7{"\n"}8{"\n"}9{"\n"}10{"\n"}11{"\n"}12</div>
            <textarea value={sql} onChange={(e)=>setSql(e.target.value)} spellCheck={false} style={s.editor}/>
          </div>

          <div style={s.resultHeader}>
            <div style={s.resultTabs}>
              <strong style={s.resultTabActive}>Results</strong>
              <span style={s.resultTab}>Chart</span>
              <span style={s.resultTab}>Query details</span>
            </div>
            <div style={s.runtime}><Clock3 size={13}/> 428 ms · 5 rows · ran {ranAt}</div>
          </div>

          <div style={s.grid}>
            <div style={s.tablePanel}>
              <table style={s.dataTable}>
                <thead>
                  <tr>
                    <th>campaign</th><th>channel</th><th style={s.num}>spend</th><th style={s.num}>revenue</th><th style={s.num}>roas</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => <tr key={r.campaign}>
                    <td>{r.campaign}</td><td><span style={s.channel}>{r.channel}</span></td>
                    <td style={s.num}>¥{r.spend.toLocaleString()}</td>
                    <td style={s.num}>¥{r.revenue.toLocaleString()}</td>
                    <td style={s.num}><strong>{r.roas.toFixed(2)}</strong></td>
                  </tr>)}
                </tbody>
              </table>
            </div>

            <aside style={s.chartPanel}>
              <div style={s.chartTitle}>Revenue by campaign</div>
              <div style={s.chartSub}>Current query result</div>
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
                <div style={s.detailLabel}>Warehouse</div>
                <strong>mock_analytics</strong>
                <div style={s.detailGrid}>
                  <span>Engine</span><b>Postgres 16</b>
                  <span>Role</span><b>analyst_readonly</b>
                  <span>Scanned</span><b>42,813 rows</b>
                  <span>Freshness</span><b>10:40 JST</b>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  shell:{minHeight:"100vh",background:"#f7f8fa",color:"#202124",fontFamily:"Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"},
  topbar:{height:58,background:"#fff",borderBottom:"1px solid #e6e8eb",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px"},
  brand:{display:"flex",alignItems:"center",gap:9,fontSize:14},
  logo:{width:30,height:30,borderRadius:8,display:"grid",placeItems:"center",background:"#111827",color:"#fff"},
  muted:{color:"#a4a7ad"},headerActions:{display:"flex",alignItems:"center",gap:12},
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
  workspace:{minWidth:0,padding:"0 18px 24px"},
  tabs:{height:46,display:"flex",alignItems:"end",gap:18,borderBottom:"1px solid #e0e3e7"},
  tabActive:{padding:"0 4px 11px",fontSize:12,fontWeight:700,borderBottom:"2px solid #4f63d8"},
  tab:{padding:"0 4px 11px",fontSize:12,color:"#8a8f98"},
  editorHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 0 12px"},
  crumb:{fontSize:11,color:"#8a9099",marginBottom:5},
  queryTitle:{fontSize:18,fontWeight:720,letterSpacing:"-.2px"},
  editorActions:{display:"flex",gap:8},
  secondary:{height:34,padding:"0 12px",borderRadius:7,border:"1px solid #d9dce2",background:"#fff",display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:650,color:"#4a4f58"},
  run:{height:34,padding:"0 14px",borderRadius:7,border:0,background:"#4f63d8",color:"#fff",display:"flex",alignItems:"center",gap:7,fontSize:12,fontWeight:750},
  editorWrap:{height:252,border:"1px solid #dfe2e6",background:"#fff",borderRadius:9,display:"grid",gridTemplateColumns:"42px 1fr",overflow:"hidden",boxShadow:"0 1px 2px rgba(16,24,40,.03)"},
  lineNumbers:{padding:"14px 10px",whiteSpace:"pre",textAlign:"right",lineHeight:1.62,fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace",fontSize:12,color:"#b0b4bb",background:"#fafbfc",borderRight:"1px solid #edf0f2"},
  editor:{border:0,resize:"none",outline:"none",padding:14,fontFamily:"ui-monospace,SFMono-Regular,Menlo,monospace",fontSize:12.5,lineHeight:1.62,color:"#263238",background:"#fff"},
  resultHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",height:46,borderBottom:"1px solid #e1e4e8",marginTop:8},
  resultTabs:{display:"flex",gap:22,height:"100%",alignItems:"end"},
  resultTabActive:{height:"100%",display:"flex",alignItems:"center",fontSize:12,borderBottom:"2px solid #4f63d8"},
  resultTab:{height:"100%",display:"flex",alignItems:"center",fontSize:12,color:"#7c828c"},
  runtime:{fontSize:11,color:"#848a93",display:"flex",alignItems:"center",gap:5},
  grid:{display:"grid",gridTemplateColumns:"minmax(0,1fr) 330px",gap:14,paddingTop:14},
  tablePanel:{background:"#fff",border:"1px solid #dfe2e6",borderRadius:9,overflow:"auto"},
  dataTable:{width:"100%",borderCollapse:"collapse",fontSize:12},
  num:{textAlign:"right"},
  channel:{padding:"3px 7px",borderRadius:999,background:"#f1f3f6",fontSize:11},
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

