import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pagePath = join(root, 'app/page.tsx');
const page = readFileSync(pagePath, 'utf8');

const surfaces = [
  ['overview', '总览', 'OverviewView', 'reference-mock'],
  ['persona', 'Persona Studio', 'PersonaView', 'reference-mock'],
  ['world', 'World Builder', 'WorldBuilderView', 'reference-mock'],
  ['content', '内容策略', 'ContentView', 'reference-mock'],
  ['live', '直播作战室', 'OverviewView', 'route-alias'],
  ['growth', '投放优化', 'GrowthView', 'reference-mock'],
  ['product', '商品分析', 'OverviewView', 'route-alias'],
  ['experiment', '模拟实验', 'OverviewView', 'route-alias'],
  ['report', '报告', 'OverviewView', 'route-alias'],
];

const tools = [
  'business_world_snapshot',
  'business_content_insights',
  'business_live_insights',
  'business_ad_insights',
  'business_commerce_insights',
  'business_scenario_experiment',
];

const failures = [];
const requiredMockFiles = [
  'lib/business-world/mock-db.ts',
  'lib/business-world/mock-service.ts',
];

for (const file of requiredMockFiles) {
  if (!existsSync(join(root, file))) failures.push(`required reference mock missing: ${file}`);
}

for (const [id, label] of surfaces) {
  if (!page.includes(`'${id}','${label}'`)) failures.push(`navigation surface missing: ${id} / ${label}`);
}

const aliasExpression = "['live','product','experiment','report'].includes(id)?'overview':id";
if (!page.includes(aliasExpression)) {
  failures.push('navigation alias behavior changed; update the reality audit and contract with the new product truth');
}

const toolReality = tools.map((name) => {
  const path = `agent/tools/${name}.ts`;
  const source = readFileSync(join(root, path), 'utf8');
  const simulated = source.includes('mock-service') || source.includes('Demo / simulated') || source.includes('模拟');
  if (!simulated) failures.push(`tool reality changed; inspect and update audit: ${path}`);
  return { name, mode: simulated ? 'simulated/mock-sqlite' : 'unknown' };
});

const onClickCount = (page.match(/onClick=/g) ?? []).length;
const interactionReality = {
  onClickHandlers: onClickCount,
  searchControl: page.includes('<div className="search">') ? 'static-div' : 'changed',
  worldSimulationButton: page.includes('运行 World Simulation') ? 'visible-static-cta' : 'changed',
};
if (onClickCount !== 1) {
  failures.push(`interaction reality changed; expected only sidebar navigation handler, found ${onClickCount}; inspect and update the audit`);
}
if (interactionReality.searchControl !== 'static-div') {
  failures.push('search interaction changed; inspect and update the audit');
}

const hardCodedSignals = [
  "value=\"1,250万\"",
  "value=\"+48%\"",
  "value=\"3.8\"",
  'ROI 预计从 3.8 提升至 4.2',
];
for (const signal of hardCodedSignals) {
  if (!page.includes(signal)) failures.push(`hard-coded UI signal changed; inspect product truth: ${signal}`);
}

const result = {
  policy: 'preserve-reference-mock-and-replace-production-boundaries-one-slice-at-a-time',
  surfaces: surfaces.map(([id, label, view, reality]) => ({ id, label, view, reality })),
  tools: toolReality,
  interactionReality,
  mockFiles: requiredMockFiles,
  failures,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('Business World Agent /');
  surfaces.forEach(([id, label, view, reality], index) => {
    const last = index === surfaces.length - 1;
    console.log(`${last ? '└──' : '├──'} ${label} (${id}) [${reality}] -> ${view}`);
  });
  console.log('');
  console.log(`UI interaction reality: ${onClickCount} onClick handler(s); sidebar navigation only`);
  console.log(`Search control: ${interactionReality.searchControl}`);
  console.log('Visible CTAs: reference/static until each slice wires real behavior');
  console.log('');
  console.log('Agent data layer');
  toolReality.forEach(({ name, mode }, index) => {
    const last = index === toolReality.length - 1;
    console.log(`${last ? '└──' : '├──'} ${name} [${mode}]`);
  });
  console.log('');
  console.log(`Mock preservation: ${requiredMockFiles.every((file) => existsSync(join(root, file))) ? 'PASS' : 'FAIL'}`);
  console.log(`Reality audit: ${failures.length === 0 ? 'PASS' : 'FAIL'}`);
  for (const failure of failures) console.error(`- ${failure}`);
}

if (failures.length > 0) process.exitCode = 1;
