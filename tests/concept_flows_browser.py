"""Real-browser acceptance for the new nine-screen task flow, no API interception.
Run with Python + Playwright Chromium. The HTTP server is created and closed here.
Shared API/Agent persistence is additionally covered by shared_workspace_browser.py.
"""
import hashlib,json,socket,subprocess,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/concept-rebuild/browser';OUT.mkdir(parents=True,exist_ok=True)
VIEWS=['overview','persona','world','content','live','growth','product','experiment','report']
checks=[];errors=[];server=None

def check(name,condition=True):
 assert condition,name
 checks.append({'name':name,'status':'PASS'});print('PASS',name,flush=True)
def nav(page,id):
 page.locator('#appNav [data-view="'+id+'"]').click();expect(page.locator('#view-'+id)).to_be_visible()
def current(page):return page.locator('.view.active')
try:
 with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
 server=subprocess.Popen(['python3','-m','http.server',str(port),'--bind','127.0.0.1','--directory',str(ROOT/'public/business-world')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 time.sleep(.4);url=f'http://127.0.0.1:{port}/ui.html#app/overview'
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True);page=browser.new_page(viewport={'width':1440,'height':1100});page.on('pageerror',lambda err:errors.append(str(err)))
  page.goto(url,wait_until='networkidle')
  for id in VIEWS:
   nav(page,id);expect(current(page).locator('h1')).to_have_count(1);expect(current(page).locator('.journey-nav')).to_have_count(1)
   check('Screen '+id+' has one task hero, one journey, and an actionable primary',current(page).locator('.screen-hero .btn.primary').count()==1)
   if current(page).locator('details').count():check(id+' examples are opt-in, never disguised as current data',not current(page).locator('details').evaluate('(e)=>e.open'))
  nav(page,'overview')
  check('Empty-workspace work counters are zero, not invented accomplishments',current(page).locator('.progress-counts strong').all_text_contents()==['0','0','0'])
  page.locator('#sourceBtn').click()
  for id,value in {'sourceName':'重建设计验收 · 人工测试记录','editGmv':'18000','editConversion':'4','editRoi':'3','editRepeat':'22','editEngagement':'800','editLive':'450','editRevenue':'14000','sourceNotes':'仅供界面与流程验证；不是平台观测。'}.items():page.locator('#'+id).fill(value)
  page.locator('#saveSource').click();expect(page.locator('#sourceModal')).not_to_be_visible()
  expect(current(page).locator('.workbench-metrics')).to_contain_text('18,000')
  check('New metric cards render only the saved manual source')
  nav(page,'persona');current(page).locator('.screen-hero [data-handoff=content]').click()
  expect(page.locator('#view-content')).to_be_visible();expect(current(page).locator('.flow-context')).to_contain_text('消费者洞察')
  check('Persona → Content carries the origin and source name')
  page.reload(wait_until='networkidle');expect(current(page).locator('.flow-context')).to_contain_text('重建设计验收')
  check('Handoff context survives an actual reload without a separate data store')
  current(page).locator('[data-work-draft=brief]').click();expect(page.locator('#draftBody')).to_contain_text('消费者洞察');expect(page.locator('#draftTitle')).to_have_value('内容策略 · 内容提纲')
  check('Context flows into an editable domain-specific draft, not an empty toast')
  page.locator('#draftForm button[type=submit]').click();expect(page.locator('#detailModal')).not_to_be_visible()
  current(page).locator('.screen-hero [data-handoff=live]').click();expect(page.locator('#view-live')).to_be_visible();expect(current(page).locator('.flow-context')).to_contain_text('内容策略')
  check('Content → Live continues the prior research context')
  page.go_back(wait_until='networkidle');expect(page.locator('#view-content')).to_be_visible();expect(current(page).locator('.flow-context')).to_contain_text('消费者洞察')
  check('Browser Back restores screen and its own handoff context')
  page.go_forward(wait_until='networkidle');expect(page.locator('#view-live')).to_be_visible();expect(current(page).locator('.flow-context')).to_contain_text('内容策略')
  check('Browser Forward restores the subsequent screen and context')
  current(page).locator('[data-clear-context]').click();page.reload(wait_until='networkidle');check('Clearing context persists across reload',current(page).locator('.flow-context').count()==0)
  for id in ['persona','content','live','growth','product']:
   nav(page,id);current(page).locator('[data-work-draft]').first.click();expect(page.locator('#draftBody')).not_to_have_value('');expect(page.locator('#draftForm')).to_contain_text('确认保存草稿');page.keyboard.press('Escape')
   check(id+' task action opens a prefilled draft and does not save before confirmation')
  nav(page,'product');current(page).locator('.screen-hero [data-handoff=growth]').click();expect(page.locator('#view-growth')).to_be_visible()
  current(page).locator('.screen-hero [data-simulate=ads]').click();expect(page.locator('#expLever')).to_have_value('ad_efficiency');expect(page.locator('#expPrompt')).not_to_have_value('')
  check('Product → Growth → Experiment preselects the correct lever without running')
  page.locator('#expRun').click();expect(page.locator('#expResult')).to_contain_text('情景估算：')
  current(page).locator('.screen-hero [data-scenario-report]').click();page.locator('#reportTitle').fill('九页流程验收报告');page.locator('#reportForm button[type=submit]').click();expect(page.locator('#selectedReport')).to_contain_text('九页流程验收报告')
  check('Experiment → Report uses the selected result and returns to a complete report screen')
  nav(page,'overview');check('Overview work counters reflect actual saved artifacts',current(page).locator('.progress-counts strong').all_text_contents()==['1','1','1'])
  for width in [1440,768,390,320]:
   page.set_viewport_size({'width':width,'height':1100 if width==1440 else 844})
   for id in VIEWS:
    nav(page,id)
    dims=page.evaluate('({doc:document.documentElement.scrollWidth,viewport:innerWidth,scroll:document.querySelector(".workspace").scrollWidth,client:document.querySelector(".workspace").clientWidth})')
    assert dims['doc']<=dims['viewport']+1 and dims['scroll']<=dims['client']+1,(width,id,dims)
    assert current(page).locator('.screen-hero .btn.primary').is_visible()
    if width in [1440,390]:page.screenshot(path=str(OUT/f'{id}-{width}.png'))
   check(str(width)+'px: nine real task screens, reachable primary actions, no page overflow')
  check('No browser exceptions in the new screen flows',not errors)
  browser.close()
except Exception:
 checks.append({'name':'Completion','status':'FAIL','error':traceback.format_exc()});traceback.print_exc()
finally:
 if server:server.terminate();server.wait(timeout=10)
 hashes={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'public/business-world/ui.html',ROOT/'public/business-world/ui.md',*sorted((ROOT/'public/business-world/src').glob('ui-*.mjs')),ROOT/'public/business-world/src/workbench.css',Path(__file__).resolve()]}
 result={'status':'PASS' if checks and all(c['status']=='PASS' for c in checks) else 'FAIL','passed':sum(c['status']=='PASS' for c in checks),'failed':sum(c['status']=='FAIL' for c in checks),'checks':checks,'errors':errors,'mockedBusinessResponses':False,'sourceHashes':hashes}
 (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print(json.dumps({'status':result['status'],'passed':result['passed'],'failed':result['failed']}))
 if result['status']!='PASS':raise SystemExit(1)
