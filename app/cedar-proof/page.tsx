"use client";

import { useMemo, useState } from "react";

const safeSql = `SELECT id, name, country, plan, monthly_spend
FROM customers
WHERE country = 'JP'
  AND active = TRUE
  AND plan IN ('pro', 'team')
ORDER BY monthly_spend DESC;`;

const dangerSql = `DELETE FROM customers
WHERE active = FALSE;`;

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
  deriving DecidableEq

def cedarAllows : SqlAction → Bool
  | .select => true
  | .delete => false

theorem read_only_policy_sound
    (a : SqlAction)
    (h : cedarAllows a = true) :
    a = .select := by
  cases a <;> simp [cedarAllows] at h ⊢`;

const rows = [
  { id: 5, name: "Emi", plan: "team", spend: 450 },
  { id: 1, name: "Alice", plan: "pro", spend: 120 },
];

export default function CedarProofPreview() {
  const [mode, setMode] = useState<"safe" | "danger">("safe");
  const result = useMemo(() => mode === "safe"
    ? { verdict: "ALLOW", sql: safeSql, executed: true }
    : { verdict: "DENY", sql: dangerSql, executed: false }, [mode]);

  return (
    <main style={{minHeight:"100vh",background:"#f7f7f5",color:"#171717",fontFamily:"Arial, sans-serif"}}>
      <div style={{maxWidth:1120,margin:"0 auto",padding:"40px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:20,borderBottom:"1px solid #ddd",paddingBottom:20,marginBottom:24}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:"#777"}}>BEFORE · VISUAL PROTOTYPE</div>
            <h1 style={{fontSize:34,margin:"8px 0 0",letterSpacing:"-1.2px"}}>Cedar Proof-Carrying Data Agent</h1>
          </div>
          <div style={{alignSelf:"start",border:"1px solid #ddd",borderRadius:999,padding:"7px 11px",fontSize:12,background:"white"}}>Vercel Preview</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}>
          <section style={card}>
            <Label>1 · USER INTENT</Label>
            <h2 style={{fontSize:22,margin:"12px 0 18px"}}>Try the same agent with safe vs dangerous SQL.</h2>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={() => setMode("safe")} style={choice(mode==="safe","#ecfdf5","#10b981")}>
                <b>Safe query</b><span style={small}>Show active Japanese customers on a paid plan.</span>
              </button>
              <button onClick={() => setMode("danger")} style={choice(mode==="danger","#fef2f2","#ef4444")}>
                <b>Dangerous query</b><span style={small}>Delete all inactive customers.</span>
              </button>
            </div>

            <pre style={code}><span style={{color:"#888"}}>Generated SQL{"\n"}</span>{result.sql}</pre>

            <div style={{marginTop:14,padding:16,border:"1px solid #ddd",borderRadius:16,display:"flex",justifyContent:"space-between",background:"#fafafa"}}>
              <div><Label>Cedar decision</Label><div style={{fontSize:28,fontWeight:800,color:result.verdict==="ALLOW"?"#047857":"#b91c1c"}}>{result.verdict}</div></div>
              <div style={{textAlign:"right",fontSize:13,color:"#666"}}>SQL executed: <b>{result.executed ? "yes" : "no"}</b><br/>DB touched: <b>{result.executed ? "read-only" : "no"}</b></div>
            </div>

            {result.executed ? (
              <div style={{marginTop:14,border:"1px solid #ddd",borderRadius:16,overflow:"hidden"}}>
                <div style={{padding:12,background:"#fafafa",fontSize:11,fontWeight:700,color:"#777",letterSpacing:1}}>MOCK DB RESULT</div>
                {rows.map((row) => <div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:14,padding:"12px 14px",borderTop:"1px solid #eee",fontSize:14}}>
                  <span>{row.name}</span><span style={{color:"#777"}}>{row.plan}</span><span>¥{row.spend}</span>
                </div>)}
              </div>
            ) : (
              <div style={{marginTop:14,padding:14,border:"1px solid #fecaca",borderRadius:16,background:"#fef2f2",color:"#991b1b",fontSize:14,lineHeight:1.6}}>
                Cedar blocks the mutation before execution. Authorization is deterministic; NL → SQL interpretation is still an AI step.
              </div>
            )}
          </section>

          <div style={{display:"grid",gap:16}}>
            <section style={card}><Label>2 · CEDAR POLICY</Label><pre style={lightCode}>{cedarPolicy}</pre></section>
            <section style={card}>
              <Label>3 · TRUST RECEIPT</Label>
              <div style={{display:"grid",gap:10,marginTop:14}}>
                <Receipt ok title="Schema known" detail="customers.country TEXT · active BOOLEAN · plan TEXT" />
                <Receipt ok title="Cedar authorization" detail={result.verdict==="ALLOW"?"read action permitted":"delete action denied"} />
                <Receipt ok title="Execution boundary" detail={result.executed?"read-only mock DB execution":"execution prevented"} />
                <Receipt title="Natural-language → SQL" detail="AI interpretation; not formally proven" />
              </div>
            </section>
          </div>
        </div>

        <section style={{...card,marginTop:16}}>
          <div style={{display:"grid",gridTemplateColumns:"minmax(240px,.8fr) minmax(300px,1.2fr)",gap:18}}>
            <div><Label>4 · LEAN PROOF TARGET</Label><h2 style={{fontSize:22}}>AFTER should machine-check the invariant.</h2><p style={{fontSize:14,color:"#666",lineHeight:1.7}}>This BEFORE page is the product mock. The implementation PR should replace the visual evaluator with the official Cedar SDK and attach Lean build evidence.</p></div>
            <pre style={{...code,marginTop:0}}>{leanProof}</pre>
          </div>
        </section>
      </div>
    </main>
  );
}

const card = {background:"white",border:"1px solid #ddd",borderRadius:24,padding:22,boxShadow:"0 5px 20px rgba(0,0,0,.03)"} as const;
const small = {display:"block",marginTop:6,fontSize:13,lineHeight:1.5,color:"#666"} as const;
const code = {marginTop:14,whiteSpace:"pre-wrap",overflowX:"auto",background:"#111",color:"#eee",padding:16,borderRadius:16,fontSize:12,lineHeight:1.7} as const;
const lightCode = {marginTop:14,whiteSpace:"pre-wrap",overflowX:"auto",background:"#f5f5f2",padding:16,borderRadius:16,fontSize:12,lineHeight:1.7} as const;
function choice(active:boolean,bg:string,border:string){return {textAlign:"left" as const,border:`1px solid ${active?border:"#ddd"}`,borderRadius:16,padding:14,background:active?bg:"#fafafa",cursor:"pointer"};}
function Label({children}:{children:React.ReactNode}){return <div style={{fontSize:11,fontWeight:800,letterSpacing:1.6,color:"#777"}}>{children}</div>}
function Receipt({ok=false,title,detail}:{ok?:boolean;title:string;detail:string}){return <div style={{display:"flex",gap:10,padding:12,border:"1px solid #e5e5e5",borderRadius:14,background:"#fafafa"}}><div style={{width:22,height:22,borderRadius:999,display:"grid",placeItems:"center",background:ok?"#d1fae5":"#fef3c7",color:ok?"#047857":"#92400e",fontSize:12,fontWeight:800}}>{ok?"✓":"!"}</div><div><b style={{fontSize:14}}>{title}</b><div style={{fontSize:12,color:"#777",marginTop:3}}>{detail}</div></div></div>}
