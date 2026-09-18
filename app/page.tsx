import { Suspense } from "react";
import { redirect } from "next/navigation";

type HomeProps={searchParams:Promise<Record<string,string|string[]|undefined>>};
/** Resolve request-specific deep links inside Suspense, preserving Cache Components. */
async function WorkspaceDestination({searchParams}:HomeProps) {
  const params=await searchParams;
  const screens=new Set(["overview","persona","world","content","live","growth","product","experiment","report"]);
  const requested=typeof params.screen==="string"?params.screen:"overview";
  const screen=screens.has(requested)?requested:"overview";
  const query=new URLSearchParams();
  if(typeof params.search==="string"&&params.search.trim())query.set("search",params.search.slice(0,200));
  if(params.source==="1")query.set("source","1");
  return redirect(`/business-world/workspace${query.size?"?"+query.toString():""}#app/${screen}`);
}
/** The audited paired UI is the single product implementation, not a competing dashboard. */
export default function Home(props:HomeProps) {
  return <Suspense fallback={<main><p role="status">正在打开经营工作区…</p></main>}><WorkspaceDestination {...props}/></Suspense>;
}
