"use client";

import { useMemo, useState } from "react";

const defaultSql = `SELECT
  id,
  name,
  country,
  plan,
  monthly_spend
FROM analytics.customers
WHERE country = 'JP'
  AND active = TRUE
  AND plan IN ('pro', 'team')
ORDER BY monthly_spend DESC;`;

const deleteSql = `DELETE FROM analytics.customers
WHERE active = FALSE;`;

const rows = [
  { id: 5, name: "Emi", country: "JP", plan: "team", monthly_spend: 450 },
  { id: 1, name: "Alice", country: "JP", plan: "pro", monthly_spend: 120 },
];

const schema = [
  ["id", "INTEGER"],
  ["name", "TEXT"],
  ["country", "TEXT"],
  ["plan", "TEXT"],
  ["monthly_spend", "INTEGER"],
  ["active", "BOOLEAN"],
];

export default function CedarAnalystBefore() {
  const [sql, setSql] = useState(defaultSql);
  const [lastRun, setLastRun] = useState<"safe" | "blocked" | null>("safe");

  const isDelete = useMemo(() => /^\s*delete\b/i.test(sql), [sql]);

  function runQuery() {
    setLastRun(isDelete ? "blocked" : "safe");
  }

  return (
    <main style={{minHeight:"100vh",background:"#f6f7f9",color:"#202124",fontFamily:"Inter, ui-sans-serif, system-ui, sans-serif"}}>
      <header style={{height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 18px",borderBottom:"1px solid #dfe3e8",background:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,borderRadius:7,background:"#1f2937",color:"#fff",display:"grid",placeItems:"center",fontWeight:800,fontSize:12}}>D</div>
          <div>
            <div style={{fontSize:13,fontWeight:700}}>Analytics Workspace</div>
            <div style={{fontSize:11,color:"#7a828e"}}>mock_analytics / SQL worksheet</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:"#6b7280"}}>
          <span>Warehouse: demo-small</span>
          <span style={{width:6,height:6,borderRadius:99,background:"#22c55e"}} />
          <span>Connected</span>
        </div>
      </header>

      <div style={{display:"grid",gridTemplateColumns:"260px minmax(0,1fr)",minHeight:"calc(100vh - 52px)"}}>
        <aside style={{borderRight:"1px solid #dfe3e8",background:"#fff",padding:"14px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 6px 10px"}}>
            <span style={{fontSize:12,fontWeight:700,color:"#4b5563"}}>EXPLORER</span>
            <span style={{fontSize:11,color:"#9ca3af"}}>⌘K</span>
          </div>
          <div style={{padding:"8px 7px",borderRadius:8,background:"#f8fafc",fontSize:12,border:"1px solid #edf0f3"}}>
            <div style={{fontWeight:700,marginBottom:8}}>▾ analytics</div>
            <div style={{paddingLeft:12}}>
              <div style={{fontWeight:650,marginBottom:8}}>▾ customers</div>
              <div style={{display:"grid",gap:7,paddingLeft:12}}>
                {schema.map(([name,type]) => (
                  <div key={name} style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:12}}>
                    <span>{name}</span><span style={{color:"#9aa1aa",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:11}}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{marginTop:16,padding:"12px 10px",borderTop:"1px solid #eef0f2"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:6}}>TABLE METADATA</div>
            <div style={{fontSize:12,lineHeight:1.7,color:"#6b7280"}}>
              10,284 rows<br/>
              Primary key: id<br/>
              Updated: 11:18 JST
            </div>
          </div>
        </aside>

        <section style={{display:"grid",gridTemplateRows:"auto minmax(240px,42vh) 1fr",minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"10px 14px",borderBottom:"1px solid #dfe3e8",background:"#fff"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={() => setSql(defaultSql)} style={tabBtn(true)}>Worksheet 1</button>
              <button onClick={() => setSql(deleteSql)} style={tabBtn(false)}>Dangerous example</button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:11,color:"#6b7280",padding:"5px 8px",borderRadius:999,background:"#f3f4f6"}}>Cedar guard enabled</div>
              <button onClick={runQuery} style={{border:0,borderRadius:7,background:"#2563eb",color:"#fff",padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>▶ Run</button>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",borderBottom:"1px solid #dfe3e8",minHeight:0}}>
            <div style={{background:"#111827",padding:0,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",borderBottom:"1px solid #273244",fontSize:11,color:"#9ca3af"}}>
                <span>SQL</span>
                <span>Standard SQL</span>
              </div>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                spellCheck={false}
                style={{width:"100%",height:"calc(100% - 34px)",minHeight:220,resize:"none",border:0,outline:"none",background:"#111827",color:"#e5e7eb",padding:"18px 20px",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:13,lineHeight:1.8}}
              />
            </div>

            <aside style={{background:"#fbfcfd",borderLeft:"1px solid #dfe3e8",padding:"14px 14px 18px"}}>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"#6b7280"}}>QUERY SAFETY</div>
              <div style={{marginTop:14,display:"grid",gap:10}}>
                <StatusRow title="SQL parsed" value="ready" ok />
                <StatusRow title="Target table" value="analytics.customers" ok />
                <StatusRow title="Operation" value={isDelete ? "DELETE" : "SELECT"} ok={!isDelete} warn={isDelete} />
                <StatusRow title="Cedar decision" value={isDelete ? "DENY" : "ALLOW"} ok={!isDelete} warn={isDelete} />
              </div>

              <div style={{marginTop:18,paddingTop:14,borderTop:"1px solid #e5e7eb"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#6b7280"}}>TRUST BOUNDARY</div>
                <div style={{marginTop:8,fontSize:11,lineHeight:1.65,color:"#6b7280"}}>
                  Cedar checks whether this database action is permitted before execution.
                  Natural-language → SQL interpretation is not formally proven.
                </div>
              </div>

              <details style={{marginTop:14}}>
                <summary style={{fontSize:11,color:"#2563eb",cursor:"pointer"}}>View policy / proof target</summary>
                <pre style={{whiteSpace:"pre-wrap",fontSize:10,lineHeight:1.6,marginTop:10,padding:10,borderRadius:8,background:"#f1f5f9",color:"#475569"}}>{`permit(... Action::"Select" ...);
forbid(... Action::"Delete" ...);

Lean target:
allow(a) = true → a = select`}</pre>
              </details>
            </aside>
          </div>

          <div style={{background:"#fff",minHeight:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",gap:18,fontSize:12}}>
                <span style={{fontWeight:700,borderBottom:"2px solid #2563eb",paddingBottom:8}}>Results</span>
                <span style={{color:"#8b93a0"}}>Query details</span>
                <span style={{color:"#8b93a0"}}>Execution plan</span>
              </div>
              <div style={{fontSize:11,color:"#8b93a0"}}>{lastRun === "safe" ? "2 rows · 184 ms" : lastRun === "blocked" ? "Execution blocked before DB call" : ""}</div>
            </div>

            {lastRun === "blocked" ? (
              <div style={{margin:18,border:"1px solid #fecaca",background:"#fff7f7",borderRadius:10,padding:16}}>
                <div style={{fontSize:13,fontWeight:800,color:"#b91c1c"}}>Query blocked by Cedar policy</div>
                <div style={{marginTop:6,fontSize:12,lineHeight:1.7,color:"#7f1d1d"}}>
                  DELETE on <code>analytics.customers</code> is denied for this analyst role. The query was not sent to the database.
                </div>
              </div>
            ) : (
              <div style={{overflow:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f8fafc",textAlign:"left"}}>
                      {["id","name","country","plan","monthly_spend"].map(h => <th key={h} style={th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.id}>
                        <td style={td}>{r.id}</td>
                        <td style={td}>{r.name}</td>
                        <td style={td}>{r.country}</td>
                        <td style={td}>{r.plan}</td>
                        <td style={td}>{r.monthly_spend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusRow({title,value,ok,warn=false}:{title:string;value:string;ok:boolean;warn?:boolean}) {
  return <div style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:12}}>
    <span style={{color:"#6b7280"}}>{title}</span>
    <span style={{fontWeight:700,color:warn?"#b91c1c":ok?"#047857":"#374151"}}>{value}</span>
  </div>
}

function tabBtn(active:boolean){
  return {border:0,borderRadius:6,background:active?"#eef2ff":"transparent",color:active?"#1d4ed8":"#6b7280",padding:"7px 10px",fontSize:12,fontWeight:active?700:500,cursor:"pointer"} as const;
}
const th = {padding:"10px 12px",borderBottom:"1px solid #e5e7eb",fontWeight:700,color:"#59616d"} as const;
const td = {padding:"10px 12px",borderBottom:"1px solid #eef0f2"} as const;
