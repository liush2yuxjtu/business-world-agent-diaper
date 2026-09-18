"""Real Chromium against HTTP-served repository UI; no intercepted business responses.
This complements, rather than replaces, the authenticated shared-workspace suite.
All numeric inputs are explicitly labelled manual design-review examples.
"""
import argparse, functools, hashlib, http.server, json, threading, traceback, zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/business-world'
OUT=ROOT/'docs/concept-rebuild'
CONCEPTS=PUBLIC/'concepts'
VIEWS=['overview','persona','world','content','live','growth','product','experiment','report']
LABELS=['经营总览','消费者洞察','业务数据','内容策略','直播运营','投放优化','商品分析','情景实验','经营报告']
KEY='bwa.user-workspace.v1'
RESULT={'status':'RUNNING','imageGenerationUsed':False,'renderer':'Playwright Chromium','businessResponsesMocked':False,'profile':'real HTTP-served browser-local UI; shared-server evidence is separate','checks':[],'errors':[],'consoleErrors':[],'concepts':[]}
parser=argparse.ArgumentParser(description=__doc__)
parser.parse_args()
OUT.mkdir(parents=True,exist_ok=True);CONCEPTS.mkdir(parents=True,exist_ok=True)

def check(name,condition=True):
    if not condition:raise AssertionError(name)
    RESULT['checks'].append({'name':name,'status':'PASS'});print('PASS',name,flush=True)
def state(page):return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
def nav(page,view):
    page.locator(f'#appNav [data-view="{view}"]').click()
    expect(page.locator('#view-'+view)).to_be_visible()
def source(page,gmv=10000):
    page.locator('#sourceBtn').click()
    values={'sourceName':'设计评审 · 人工录入示例','sourceNotes':'隔离的设计评审示例；不是实际平台数据。','editGmv':gmv,'editConversion':3,'editRoi':2,'editRepeat':20,'editEngagement':400,'editLive':200,'editRevenue':9000}
    for name,value in values.items():page.locator('#'+name).fill(str(value))
    page.locator('#saveSource').click();expect(page.locator('#sourceModal')).not_to_be_visible()
def save_draft(page):
    page.locator('#draftForm button[type=submit]').click();expect(page.locator('#detailModal')).not_to_be_visible()
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/favicon.ico':self.send_response(204);self.end_headers();return
        super().do_GET()
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(PUBLIC)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
URL=f'http://127.0.0.1:{server.server_port}/ui.html'
page=None
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1100},accept_downloads=True,reduced_motion='reduce')
    page=context.new_page();page.set_default_timeout(12000)
    page.on('pageerror',lambda error:RESULT['errors'].append(str(error)))
    page.on('console',lambda message:RESULT['consoleErrors'].append(message.text) if message.type=='error' else None)
    writes=[];context.on('request',lambda request:writes.append({'method':request.method,'url':request.url}) if request.method not in ['GET','HEAD'] else None)
    page.goto(URL+'#app/overview',wait_until='networkidle')
    expect(page.locator('#view-overview h1')).to_contain_text('下一步行动')
    expect(page.locator('#sourceBanner')).to_contain_text('尚无经营记录')
    check('Empty workspace does not display invented revenue or connected platforms','已连接' not in page.locator('.view.active').inner_text())
    source(page);baseline=state(page)['snapshot']
    check('Real source form persists labelled manual design-review input',baseline['metrics']['gmv']==10000 and baseline['status']=='unverified')
    nav(page,'persona');page.locator('#view-persona .screen-hero [data-handoff=content]').click()
    expect(page.locator('#view-content .flow-context')).to_contain_text('消费者洞察')
    expect(page.locator('#view-content .flow-context')).to_contain_text('设计评审')
    check('Persona to content carries origin and source context')
    page.locator('#view-content [data-work-draft=brief]').click()
    expect(page.locator('#draftBody')).to_contain_text('消费者洞察')
    page.locator('#draftTitle').fill('人群研究后的内容提纲');save_draft(page)
    brief=next(d for d in state(page)['drafts'] if d['kind']=='brief')
    page.locator('#view-content [data-draft-id="'+brief['id']+'"]').click()
    page.locator('[data-plan-from-draft]').click();expect(page.locator('#draftBody')).to_contain_text('发布时间：待安排');save_draft(page)
    check('Content brief becomes a separately confirmed publishing plan',any(d['kind']=='plan' and '消费者洞察' in d['body'] for d in state(page)['drafts']))
    nav(page,'live');page.locator('#view-live [data-work-draft][data-purpose]').click()
    expect(page.locator('#draftTitle')).to_have_value('直播运营 · 复盘 · 研究任务');save_draft(page)
    check('Live operations creates a contextual review draft, not a fake live action',any('复盘' in d['title'] for d in state(page)['drafts']))
    nav(page,'product');page.locator('#view-product .screen-hero [data-handoff=growth]').click()
    expect(page.locator('#view-growth .flow-context')).to_contain_text('商品分析')
    page.locator('#view-growth .screen-hero [data-simulate=ads]').click()
    expect(page.locator('#expLever')).to_have_value('ad_efficiency')
    expect(page.locator('#view-experiment .flow-context')).to_contain_text('投放优化')
    check('Product to growth to experiment preserves context and selects the correct lever')
    page.locator('#expPrompt').fill('设计评审：广告效率提高20%');page.locator('#expChange').fill('20');page.locator('#expRun').click()
    expect(page.locator('#expResult')).to_contain_text('设计评审：广告效率提高20%')
    run=state(page)['scenarios'][0]
    check('Actual sensitivity calculation persists without changing the baseline',run['modeled']['gmv']==10700 and state(page)['snapshot']==baseline)
    page.locator('#expResult [data-scenario-report]').click();page.locator('#reportTitle').fill('经营情景评审');page.locator('#reportForm button[type=submit]').click()
    expect(page.locator('#selectedReport h2')).to_have_text('经营情景评审')
    page.locator('#reportNote').fill('人工评审意见：核对来源后再决定下一步。');page.locator('#noteForm button[type=submit]').click();expect(page.locator('#toast')).to_contain_text('人工备注已保存')
    original_report=state(page)['reports'][0]
    source(page,13000)
    check('New source values cannot rewrite selected report evidence',state(page)['reports'][0]==original_report and original_report['baseline']['metrics']['gmv']==10000)
    with page.expect_popup() as popup_info:page.locator('#downloadReport').click()
    popup=popup_info.value;popup.wait_for_load_state('domcontentloaded');expect(popup.locator('body')).to_contain_text('经营情景评审');popup.close()
    check('Print/PDF document opens using the selected immutable report')
    with page.expect_download() as download_info:page.locator('#downloadPpt').click()
    ppt=OUT/'selected-report.pptx';download_info.value.save_as(str(ppt))
    with zipfile.ZipFile(ppt) as archive:check('PPT export is a real OOXML presentation','ppt/presentation.xml' in archive.namelist())
    page.locator('#selectedReport [data-info=share]').click();page.locator('#shareConsent').check();page.locator('#shareForm button[type=submit]').click();url=page.locator('#shareLink').input_value()
    recipient=browser.new_context();reader=recipient.new_page();reader.goto(url,wait_until='networkidle');expect(reader.locator('#sharedReport')).to_contain_text('经营情景评审')
    check('Consented report copy is readable in another browser and has no editing form',reader.locator('form,input,textarea').count()==0)
    recipient.close();page.locator('#detailModal [data-close-dialog]').first.click()
    nav(page,'overview');nav(page,'product');nav(page,'growth');page.go_back();expect(page.locator('#view-product')).to_be_visible()
    check('Browser Back returns to the previous business screen')
    page.locator('#sourceBtn').click();page.keyboard.press('Escape');expect(page.locator('#sourceModal')).not_to_be_visible()
    check('Keyboard Escape closes the accessible source dialog')
    page.keyboard.press('Control+k');expect(page.locator('#searchInput')).to_be_focused();page.locator('#searchInput').fill('experiment');page.keyboard.press('Enter');expect(page.locator('#view-experiment')).to_be_visible()
    check('Keyboard search navigates to a real business screen')
    saved=state(page);page.reload(wait_until='networkidle');check('Drafts, scenarios, reports and selected source survive reload',state(page)==saved)
    captures={};titles=set()
    for width,height in [(1440,1100),(768,1100),(390,844),(320,844)]:
        page.set_viewport_size({'width':width,'height':height})
        for index,view in enumerate(VIEWS):
            page.goto(URL+'#app/'+view,wait_until='networkidle')
            expect(page.locator('#view-'+view)).to_be_visible()
            expect(page.locator('#view-'+view+' [data-screen-hero]')).to_have_count(1)
            if view=='experiment':
                page.locator('#experimentHistory [data-run-id]').first.click()
                page.locator('.workspace').evaluate('(el)=>el.scrollTop=0');page.evaluate('window.scrollTo(0,0)')
            if width==1440:titles.add(page.locator('#view-'+view+' h1').inner_text())
            check(f'{view}: no document overflow at {width}px',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            text=page.locator('body').inner_text();captures[f'{width}-{view}']=text
            check(f'{view}: visible copy stays within the product boundary at {width}px',not any(token in text for token in ['intent-audit','developer-audit','DATABASE_URL','console.log','schemaReady']))
            if width==1440:
                filename=f'{index+1:02}-{view}.png';path=CONCEPTS/filename
                page.screenshot(path=str(path),full_page=True,animations='disabled')
                RESULT['concepts'].append({'screen':view,'label':LABELS[index],'file':filename,'width':width,'height':height,'sha256':sha(path),'inputProvenance':'explicit manual design-review examples; not live business data'})
            else:
                path=OUT/f'{width}-{view}.png';page.screenshot(path=str(path),full_page=True,animations='disabled')
    check('Exactly one distinct browser-rendered concept exists for each actual screen',len(RESULT['concepts'])==len(titles)==9 and len({x['sha256'] for x in RESULT['concepts']})==9)
    check('No external publishing, budget mutations or email delivery occurred',not writes)
    check('No uncaught browser errors or unexpected console errors',not RESULT['errors'] and not RESULT['consoleErrors'])
    (OUT/'visible-copy.json').write_text(json.dumps(captures,ensure_ascii=False,indent=2)+'\n')
    browser.close()
 RESULT['status']='PASS'
except Exception as error:
 RESULT['status']='FAIL';RESULT['failure']=str(error);traceback.print_exc()
 try:
    if page:page.screenshot(path=str(OUT/'failure.png'),full_page=True)
 except Exception:pass
 raise
finally:
 server.shutdown();server.server_close()
 RESULT['sourceHashes']={str(path.relative_to(ROOT)):sha(path) for path in sorted([PUBLIC/'ui.html',PUBLIC/'ui.md',*PUBLIC.glob('src/ui-*'),Path(__file__)]) if path.is_file()}
 RESULT['passed']=len(RESULT['checks']);(OUT/'results.json').write_text(json.dumps(RESULT,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':RESULT['status'],'passed':RESULT['passed'],'concepts':len(RESULT['concepts'])}),flush=True)

if RESULT['status']=='PASS':
 manifest={'schemaVersion':1,'method':'real browser rendering; no image-gen','sourceHashes':RESULT['sourceHashes'],'screens':RESULT['concepts'],'penpotFileModified':False}
 (CONCEPTS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 (OUT/'penpot-import.json').write_text(json.dumps({'remotePenpotFile':None,'remoteFileModified':False,'frames':[{'name':item['label'],'image':'../../public/business-world/concepts/'+item['file'],'route':'#app/'+item['screen'],'width':1440,'height':1100} for item in RESULT['concepts']]},ensure_ascii=False,indent=2)+'\n')
 cards=''.join('<article><a href="'+item['file']+'"><img loading="lazy" src="'+item['file']+'" alt="'+item['label']+'概念图"></a><h2>'+item['label']+'</h2><a href="../ui.html#app/'+item['screen']+'">打开可交互页面 ↗</a></article>' for item in RESULT['concepts'])
 (CONCEPTS/'index.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Business World Agent · 逐屏设计评审</title><style>body{margin:0;background:#f4f8ff;color:#183354;font:15px/1.7 system-ui,sans-serif}main{max-width:1320px;margin:50px auto;padding:24px}h1{font-size:32px}p{color:#5d769b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px}article{background:white;border:1px solid #dbe7f6;border-radius:14px;overflow:hidden;padding-bottom:18px}img{width:100%;display:block}h2,article>a:last-child{margin:14px 18px}h2{font-size:17px}a{color:#2468e8}</style><main><h1>九个页面，一个连贯的经营流程。</h1><p>每个真实页面一张独立概念图。全部由真实浏览器渲染，未使用 image-gen。图片中的数值是明确标记的人工设计评审示例，不是业务实绩。</p><p>PNG 可作为设计工具的导入素材；本次未修改远端 Penpot 文件。</p><section class="grid">'+cards+'</section></main></html>')
 (OUT/'DELIVERY.md').write_text('# Browser-rendered workbench redesign\n\nNine separate concepts are in `public/business-world/concepts/`. No image-gen was used. Inputs in screenshots are explicitly labelled manual design-review examples.\n\nThe contextual-flow and four-viewport browser suite passed '+str(RESULT['passed'])+' checks. Authenticated UI/registered-agent, durable-store, restart, conflict and unavailable-state evidence is recorded separately in `docs/ui-shared-audit/runtime/results.json`. Neither suite certifies cloud-provider availability or a live language-model turn.\n\nReview `public/business-world/concepts/index.html` and the interactive workspace before a human decides whether to merge. The prior concept boards are not used as evidence of implemented capabilities. No remote Penpot document was modified.\n')
