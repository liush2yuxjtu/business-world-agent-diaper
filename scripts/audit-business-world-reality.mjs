import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8');
const page = read('app/page.tsx');
const service = read('lib/business-world/real-service.ts');
const stateRoute = read('app/api/business-world/state/route.ts');
const runtimeEvidencePath = join(root, 'docs/runtime-reality-evidence.md');
const runtimeEvidence = existsSync(runtimeEvidencePath) ? readFileSync(runtimeEvidencePath, 'utf8') : '';
const runtimeBrowserPass = runtimeEvidence.includes('Product-level Playwright acceptance PASS');
const runtimeDbUnconfigured = runtimeEvidence.includes('configured\": false') || runtimeEvidence.includes('`DATABASE_URL` as unconfigured');
const scenarioRoute = read('app/api/business-world/scenario/route.ts');
const toolSources = ['business_world_snapshot','business_content_insights','business_live_insights','business_ad_insights','business_commerce_insights','business_scenario_experiment'].map(n => read(`agent/tools/${n}.ts`)).join('\n');

const checks = [
  ['Data', runtimeDbUnconfigured ? 1 : (service.includes('business_world_state') && page.includes('NO VERIFIED SOURCE') ? 2 : service.includes('business_world_state') ? 1 : 0), runtimeDbUnconfigured ? 'Real boundary is deployed, but no verified business source is connected.' : 'No silent mock fallback; unknown data is shown as unavailable.'],
  ['Logic', service.includes('runScenarioExperiment') && service.includes('modeled: true') ? 2 : 0, 'Scenario logic is executable and labels modeled output explicitly.'],
  ['Persistence', runtimeDbUnconfigured ? 1 : (service.includes('Neon Postgres') && service.includes('insert into business_world_state') && service.includes('business_world_scenario_run') ? 2 : 0), runtimeDbUnconfigured ? 'Persistence implementation exists, but deployed DATABASE_URL is unconfigured.' : 'Business state and scenario runs persist server-side.'],
  ['API/Tool', stateRoute.includes('saveBusinessWorldState') && scenarioRoute.includes('runScenarioExperiment') && !toolSources.includes('mock-service') ? 2 : 0, 'HTTP routes and Eve tools share the real service boundary.'],
  ['UI', page.includes("active === 'live'") && page.includes("active === 'growth'") && page.includes("active === 'product'") && page.includes("active === 'experiment'") && page.includes('onClick={run}') ? 2 : 0, 'Former aliases/static CTAs are wired to real states/actions.'],
  ['Agent', !toolSources.includes('mock-service') && toolSources.includes('real-service') ? 2 : 0, 'Business Agent tools read the same persistent source as the UI.'],
  ['Provenance', service.includes('sourceLabel') && service.includes('observedAt') && service.includes('sourceMode') ? 2 : 0, 'Source label/type, observation time, storage, and update time are returned.'],
  ['Browser Eval', runtimeBrowserPass ? 2 : 0, runtimeBrowserPass ? 'Deployed Playwright product acceptance PASS.' : 'Requires reproducible deployed-browser evidence; source inspection cannot award this.'],
  ['DB/State Eval', existsSync(join(root,'.eve/business-world-agent.sqlite')) && service.includes('Neon Postgres') ? 1 : 0, 'Implementation exists; deployed DB read/write still requires runtime evidence.'],
  ['Evidence', runtimeBrowserPass ? 2 : (existsSync(join(root,'docs/mock-to-real-contract.md')) && existsSync(join(root,'scripts/audit-business-world-reality.mjs')) ? 1 : 0), runtimeBrowserPass ? 'Build, browser, API and screenshot evidence are recorded.' : 'Code/build evidence exists; deployed browser + DB evidence pending.'],
];
const total = checks.reduce((n, [,score]) => n + score, 0);
const classification = total <= 7 ? 'SIMULATED' : total <= 14 ? 'PARTIAL' : total <= 18 ? 'MOSTLY REAL' : 'REAL';
const fatal = [
  toolSources.includes('mock-service') ? 'Agent tools still depend on mock-service' : null,
  page.includes("['live','product','experiment','report'].includes(id)?'overview':id") ? 'Navigation still contains route aliases' : null,
  page.includes('ROI 预计从 3.8 提升至 4.2') ? 'UI still presents hard-coded prediction as product output' : null,
].filter(Boolean);

const result={total,max:20,classification,checks:checks.map(([item,score,evidence])=>({item,score,evidence})),fatal};
if(process.argv.includes('--json')) console.log(JSON.stringify(result,null,2));
else {
  console.log(`VALUE reality score: ${total}/20 — ${classification}`);
  for(const [item,score,evidence] of checks) console.log(`${item.padEnd(14)} ${score}/2  ${evidence}`);
  if(fatal.length) for(const f of fatal) console.error(`FATAL: ${f}`);
  console.log('Runtime-only points are awarded only when deployed evidence is recorded; DB write/read points remain withheld while persistence is unconfigured.');
}
if(fatal.length) process.exitCode=1;
