// Deterministic visual checks; never reads production records or writes platform data.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || import.meta.url);
const { chromium } = require('playwright');
const output = path.resolve(process.argv[2] || 'artifacts/screen-alignment/after');
const base = process.env.VISUAL_BASE_URL || 'http://127.0.0.1:4328';
const sql = await fs.readFile('lib/business-world/supabase-mock-seed.sql', 'utf8');
const data = JSON.parse(sql.slice(sql.indexOf("'{") + 1, sql.indexOf("}'::jsonb") + 1));
const snapshot = { provenance: { sourceMode: 'simulated', provider: 'visual-test-fixture', sourceLabel: '确定性模拟数据 · 非真实经营结果', asOf: '2026-09-18T00:00:00Z', updatedAt: '2026-09-18T00:00:00Z', storage: 'test-only', writable: false }, data };
const screens = ['overview','persona','world','content','live','growth','product','experiment','report'];
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const results = [];
const checks = [];
try {
  for (const width of [1586, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 992 }, deviceScaleFactor: 1, locale: 'zh-CN', timezoneId: 'UTC', colorScheme: 'light', reducedMotion: 'reduce' });
    await context.route('**/api/business-world/state', route => route.fulfill({ json: snapshot }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [index, screen] of screens.entries()) {
      await page.goto(`${base}/?screen=${screen}`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const file = `${String(index + 1).padStart(2, '0')}-${screen}-${width}.png`;
      await page.screenshot({ path: path.join(output, file), animations: 'disabled' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      results.push({ screen, viewport: { width, height: width === 390 ? 844 : 992 }, file, overflow, errors: [...errors] });
    }
    if (process.env.VERIFY_INTERACTIONS === '1') {
      const assert = (value, message) => { if (!value) throw new Error(message); };
      await page.goto(`${base}/?screen=world`);
      await page.getByRole('button', { name: /复购家庭复购/ }).click();
      assert(await page.locator('.world-detail .connection-art h3').textContent() === '复购家庭复购', 'World selection did not update detail');
      assert(await page.getByRole('button', { name: /复购家庭复购/ }).getAttribute('aria-pressed') === 'true', 'World selection state missing');
      assert(await page.locator('.world-content').evaluate(el => {
        const last = el.lastElementChild?.getBoundingClientRect();
        return !last || last.bottom <= el.getBoundingClientRect().bottom;
      }), 'World content nodes clipped by next row');
      await page.goto(`${base}/?screen=persona`);
      await page.getByRole('button', { name: /复购家庭/ }).click();
      assert(await page.locator('.persona-detail .detail-heading h2').textContent() === '复购家庭', 'Persona selection did not update detail');
      await page.getByLabel('搜索功能').fill('直播');
      await page.getByRole('option', { name: '直播作战室' }).click();
      assert(new URL(page.url()).searchParams.get('screen') === 'live', 'Search navigation failed');
      await page.getByRole('button', { name: '数据源', exact: true }).click();
      assert(await page.getByRole('dialog').isVisible(), 'Source dialog missing');
      assert(await page.getByRole('button', { name: '只读来源' }).isDisabled(), 'Read-only source is writable');
      await page.getByLabel('关闭数据源面板').click();
      await page.goto(`${base}/?screen=report`);
      await page.getByRole('tab', { name: '数据与依据' }).click();
      assert(await page.getByText('visual-test-fixture', { exact: true }).isVisible(), 'Evidence tab missing provenance');
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: '导出摘要' }).click();
      const download = await downloadPromise;
      assert(download.suggestedFilename() === 'business-world-brief.txt', 'Wrong download');
      let calls = 0;
      await context.route('**/api/business-world/scenario', async route => {
        calls++;
        const body = route.request().postDataJSON();
        assert(body.changePercent === 10 && body.lever === 'ad_efficiency', 'Scenario input changed');
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.fulfill({ json: { id: 'visual-fixture', result: { assumption: '仅用于 UI 验证', baselineRoi: 4.32, modeledRoi: 4.752, baselineConversionRate: 3.24, modeledConversionRate: 3.24 } } });
      });
      await page.goto(`${base}/?screen=experiment`);
      const run = page.getByRole('button', { name: '运行并保存' });
      await run.click();
      assert(await run.isDisabled(), 'Run button must be disabled while pending');
      await page.getByText('模拟结果已保存', { exact: true }).waitFor();
      assert(calls === 1, 'Unexpected scenario writes');
      assert(await page.locator('.modeled-bar').evaluate(el => el.getBoundingClientRect().height > 0), 'Scenario chart did not update');
      await context.route('**/api/business-world/state', route => route.fulfill({ json: { provenance: { ...snapshot.provenance, sourceMode: 'unavailable' }, data: null } }));
      await page.goto(`${base}/?screen=experiment`);
      assert(await run.isDisabled(), 'Missing data should disable simulation');
      await context.route('**/api/business-world/state', route => route.fulfill({ status: 503, json: { error: '测试来源暂不可用' } }));
      await page.goto(base);
      await page.getByRole('heading', { name: '数据暂时不可用' }).waitFor();
      await context.route('**/api/business-world/state', route => route.fulfill({ json: snapshot }));
      await page.getByRole('button', { name: '重试', exact: true }).click();
      await page.getByRole('heading', { name: '核心人群', exact: true }).waitFor();
      checks.push({ width, worldSelection: true, worldContainment: true, persona: true, search: true, readOnlySource: true, reportTab: true, download: true, scenarioFixture: true, empty: true, errorRetry: true });
    }
    await context.close();
  }
} finally { await browser.close(); }
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ base, dataMode: 'intercepted deterministic simulated seed', checks, results }, null, 2));
console.log(JSON.stringify(results.map(({screen,viewport,overflow,errors}) => ({screen,width:viewport.width,overflow,errors}))));
if (results.some(r => r.overflow || r.errors.length)) process.exitCode = 1;
