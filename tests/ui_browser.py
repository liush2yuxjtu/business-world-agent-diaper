"""Real HTTP / Chromium audit of built ui.html. No page.set_content or mocked API routes.
Run: npm run build && python tests/ui_browser.py
Requires: playwright + Chromium. QA evidence is reproducible in docs/ui-audit/runtime/.
"""
import hashlib,json,os,socket,subprocess,time,traceback,urllib.request,zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/ui-audit/runtime';OUT.mkdir(parents=True,exist_ok=True)
VIEWS=['overview','persona','world','content','live','growth','product','experiment','report']
KEY='bwa.user-workspace.v1'
checks=[];errors=[];console=[];mutations=[];server=None

def check(name,fn):
    try:
        detail=fn();checks.append({'name':name,'status':'PASS','evidence':detail})
        print('PASS',name,flush=True)
    except Exception as e:
        checks.append({'name':name,'status':'FAIL','evidence':str(e)})
        print('FAIL',name,str(e)[:700],flush=True)
        raise

def assert_true(value,message='Assertion failed'):
    assert value,message

def nav(page,view):
    page.locator(f'#appNav [data-view="{view}"]').click()
    expect(page.locator('#view-'+view)).to_be_visible()

def state(page):return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)

def fill_source(page,gmv='1000000',name='订单汇总',notes='2026年9月经营记录'):
    page.locator('#sourceBtn').click()
    for key,value in {'sourceName':name,'editGmv':gmv,'editConversion':'5','editRoi':'4','editRepeat':'25','editEngagement':'1234','editLive':'600','editRevenue':'800000','sourceNotes':notes}.items():
        page.locator('#'+key).fill(value)
    page.locator('#saveSource').click()
    expect(page.locator('#sourceModal')).not_to_be_visible()

sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
URL=os.environ.get('UI_AUDIT_URL') or f'http://127.0.0.1:{port}/ui.html'
if not os.environ.get('UI_AUDIT_URL'):
    server=subprocess.Popen(['python3','-m','http.server',str(port),'--bind','127.0.0.1','--directory',str(ROOT/'public/business-world')],cwd=ROOT,env={**os.environ,'PORT':str(port)},stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    for _ in range(60):
        try:urllib.request.urlopen(URL);break
        except Exception:time.sleep(.1)
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
    page=context.new_page();page.set_default_timeout(6000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda msg:console.append(msg.text) if msg.type=='error' else None)
    context.on('request',lambda r:mutations.append({'url':r.url,'method':r.method}) if r.method not in ['GET','HEAD'] else None)
    response=page.goto(URL,wait_until='networkidle')
    check('Served build has expected title and byte provenance',lambda:(expect(page).to_have_title('Business World Agent'),assert_true(response.status==200),assert_true(hashlib.sha256(response.body()).hexdigest()==hashlib.sha256((ROOT/'public/business-world/ui.html').read_bytes()).hexdigest())) and 'HTTP 200, exact built bytes')
    page.locator('#appMode').click()
    check('No baseline means empty business metrics, not demo facts',lambda:(expect(page.locator('#sourceBanner')).to_contain_text('尚无经营记录'),expect(page.locator('#kpiRow')).not_to_contain_text('2,483,221')) and 'No seeded facts')
    page.goto(URL+'#persona',wait_until='networkidle')
    check('Existing upstream hash links remain compatible',lambda:expect(page.locator('#view-persona')).to_be_visible())
    for view in VIEWS:
        nav(page,view)
        check('Navigation '+view,lambda view=view:assert_true(page.locator('.view.active').count()==1 and page.locator('#view-'+view).is_visible()))
    nav(page,'experiment');page.locator('#expPrompt').fill('无基准场景');page.locator('#expRun').click()
    check('Scenario without a baseline is blocked',lambda:expect(page.locator('#expError')).to_contain_text('请先添加经营记录'))
    nav(page,'world');page.locator('#sourceBtn').click();page.keyboard.press('Escape')
    check('Source Escape closes and restores focus',lambda:(expect(page.locator('#sourceModal')).not_to_be_visible(),expect(page.locator('#sourceBtn')).to_be_focused()))
    page.locator('#sourceBtn').click();page.locator('#saveSource').click()
    check('Blank numeric fields cannot save as zero',lambda:(expect(page.locator('#sourceError')).not_to_be_empty(),assert_true(state(page) is None)))
    page.locator('#cancelSource').click()
    fill_source(page)
    snap=state(page)['snapshot']
    check('Source saves all values, name and notes without claiming verification',lambda:(assert_true(snap['metrics']['gmv']==1000000 and snap['metrics']['engagement']==1234 and snap['name']=='订单汇总' and snap['notes']=='2026年9月经营记录' and snap['status']=='unverified'),expect(page.locator('#sourceBanner')).to_contain_text('人工录入')))
    saved_time=page.locator('#sourceTime').inner_text();page.locator('#refreshBtn').click()
    check('Refresh does not invent source freshness',lambda:expect(page.locator('#sourceTime')).to_have_text(saved_time))
    page.reload(wait_until='networkidle')
    check('Snapshot survives a real reload',lambda:(expect(page.locator('#kpiRow')).to_contain_text('1,000,000'),assert_true(state(page)['snapshot']==snap)))
    nav(page,'overview');check('Overview uses same snapshot',lambda:expect(page.locator('#view-overview .page-records')).to_contain_text('1,000,000'))
    nav(page,'content');check('Content uses same snapshot',lambda:expect(page.locator('#view-content .page-records')).to_contain_text('1,234'))
    nav(page,'persona');page.locator('#view-persona summary').click();page.locator('.persona-card').nth(1).click()
    check('Persona click updates selected inspector without the original exception',lambda:expect(page.locator('#view-persona .example-catalog .grid-3').locator(':scope > .card').nth(2)).to_contain_text('人群详情：囤货型家庭'))
    page.locator('[data-persona-filter="inferred"]').click()
    check('Persona filters apply to actual cards',lambda:(assert_true(page.locator('.persona-card:visible').count()==1),expect(page.locator('.persona-card:visible')).to_contain_text('敏感肌')))
    page.locator('[data-persona-filter="inferred"]').focus();page.keyboard.press('ArrowRight')
    check('Persona tab arrow keyboard support',lambda:(expect(page.locator('[data-persona-filter="template"]')).to_have_attribute('aria-selected','true'),assert_true(page.locator('.persona-card:visible').count()==1)))
    check('Strategy templates cannot carry a measured audience claim',lambda:(expect(page.locator('.persona-card:visible')).not_to_contain_text('1,026,778'),expect(page.locator('.persona-card:visible')).not_to_contain_text('次/月'),expect(page.locator('.persona-card:visible')).to_contain_text('购买频次：待收集证据')))
    page.locator('[data-persona-filter="all"]').click()
    for view,selector in [('content','.bubble'),('live','.fstep'),('growth','.alert-row'),('product','.deep-table tbody tr')]:
        nav(page,view);page.locator('#view-'+view+' details').evaluate('(e)=>e.open=true')
        page.locator('#view-'+view+' '+selector).first.click()
        if view!='product':
            check(view+' selected example opens honest detail',lambda:(expect(page.locator('#detailModal')).to_be_visible(),expect(page.locator('#detailModal')).to_contain_text('演示案例')))
            page.keyboard.press('Escape')
        else:check('Product row updates product inspector',lambda:expect(page.locator('#view-product .example-catalog .grid-3').locator(':scope > .card').nth(1)).to_contain_text('云柔透气拉拉裤 L码'))
    nav(page,'product');page.locator('[data-product-category="纸尿裤"]').click()
    check('Product category filters actual SKU rows',lambda:(assert_true(page.locator('[data-product-row]:visible').count()==1),expect(page.locator('[data-product-row]:visible')).to_contain_text('纸尿裤')))
    page.locator('[data-clear-filter]').click()
    nav(page,'growth');page.locator('[data-channel="搜索"]').click()
    check('Budget channel filters campaigns',lambda:(assert_true(page.locator('#view-growth .budget-wrap').locator('..').locator('.deep-table tbody tr:visible').count()==1)))
    page.locator('[data-clear-filter]').click()
    nav(page,'content');page.get_by_role('button',name='生成 brief',exact=True).click()
    page.locator('#draftTitle').fill('夜间防漏内容提纲');page.locator('#draftBody').fill('先核对用户问题，再撰写内容，不自动发布。')
    check('Draft is not saved before confirmation',lambda:assert_true(len(state(page)['drafts'])==0))
    page.locator('#draftForm button[type=submit]').click()
    check('Editable brief persists only after confirmation',lambda:assert_true(state(page)['drafts'][0]['title']=='夜间防漏内容提纲'))
    page.locator('#view-content [data-draft-id]').first.click();page.locator('[data-plan-from-draft]').click();page.locator('#draftBody').fill('9月20日发布；沿用人工编辑的提纲。');page.locator('#draftForm button[type=submit]').click()
    check('Edited brief continues to an explicitly confirmed publishing plan',lambda:assert_true(state(page)['drafts'][0]['kind']=='plan' and '9月20日' in state(page)['drafts'][0]['body']))
    nav(page,'live');page.locator('#view-live details').evaluate('(e)=>e.open=true');page.locator('#view-live .legend-list span').first.click()
    check('Live audience navigates to Persona with selected context',lambda:(expect(page.locator('#view-persona')).to_be_visible(),expect(page.locator('#view-persona .flow-context')).to_contain_text('18-24岁')))
    nav(page,'growth');page.locator('#view-growth details').evaluate('(e)=>e.open=true');page.get_by_role('button',name='+ 新建实验',exact=True).click()
    check('Growth experiment creates a real editable experiment draft',lambda:(expect(page.locator('#view-experiment')).to_be_visible(),expect(page.locator('#expPrompt')).to_have_value('比较投放优化假设')))
    nav(page,'content');page.locator('#view-content .bubble').first.click();page.locator('#detailModal [data-view="product"]').click()
    check('Topic detail hands off to Product and closes the prior dialog',lambda:(expect(page.locator('#view-product')).to_be_visible(),expect(page.locator('#detailModal')).not_to_be_visible(),expect(page.locator('#view-product .flow-context')).not_to_be_empty()))
    nav(page,'experiment');page.locator('#expPrompt').fill('转化率提升');page.locator('#expLever').select_option('checkout_conversion');page.locator('#expChange').fill('-100');page.locator('#expRun').click()
    check('Invalid scenario is rejected with useful error',lambda:(expect(page.locator('#expError')).to_contain_text('-95'),assert_true(len(state(page)['scenarios'])==0)))
    page.locator('#expChange').fill('20');page.locator('#expRun').click()
    check('Scenario has genuine pending and duplicate-submit protection',lambda:expect(page.locator('#expRun')).to_be_disabled())
    expect(page.locator('#expRun')).to_be_enabled()
    check('Scenario result is lever-specific and baseline remains unchanged',lambda:(expect(page.locator('#expResult')).to_contain_text('1,200,000'),assert_true(state(page)['snapshot']==snap),assert_true(state(page)['scenarios'][0]['modeled']['roi']==4)))
    page.locator('#expResult [data-scenario-report]').click();page.locator('#reportTitle').fill('经营报告');page.locator('#reportForm button[type=submit]').click()
    check('Scenario creates a report with frozen baseline and assumptions',lambda:(expect(page.locator('#selectedReport')).to_contain_text('1,200,000'),assert_true(state(page)['reports'][0]['scenario']['baseline']==snap)))
    page.locator('#reportNote').fill('保留现有经营基准，建议先做小规模验证。');page.locator('#noteForm button[type=submit]').click();page.reload(wait_until='networkidle')
    check('Human report note persists separately across reload',lambda:expect(page.locator('#reportNote')).to_have_value('保留现有经营基准，建议先做小规模验证。'))
    with page.expect_popup() as event:page.locator('#downloadReport').click()
    report_page=event.value;report_page.wait_for_load_state('load');expect(report_page.locator('body')).to_contain_text('1,200,000')
    report_page.pdf(path=str(OUT/'selected-report.pdf'),format='A4',print_background=True)
    check('PDF path contains selected report and a real PDF can be rendered',lambda:assert_true((OUT/'selected-report.pdf').read_bytes().startswith(b'%PDF-')))
    report_page.close()
    with page.expect_download() as event:page.locator('#downloadPpt').click()
    download=event.value;download.save_as(str(OUT/'selected-report.pptx'))
    with zipfile.ZipFile(OUT/'selected-report.pptx') as z:
        names=z.namelist();slides=''.join(z.read(n).decode() for n in names if n.startswith('ppt/slides/slide') and n.endswith('.xml'))
        check('PPT is a real OOXML presentation using the same report values',lambda:(assert_true(download.suggested_filename.endswith('.pptx')),assert_true('ppt/presentation.xml' in names),assert_true('1,200,000' in slides and '经营报告' in slides and '人工备注' in slides)))
    page.locator('#selectedReport [data-info="share"]').click()
    check('Report sharing requires consent and discloses embedded-data privacy',lambda:(expect(page.locator('#detailModal')).to_contain_text('任何拿到链接'),assert_true(page.locator('#shareLink').count()==0)))
    page.locator('#shareConsent').check();page.locator('#shareForm button[type=submit]').click();shared_url=page.locator('#shareLink').input_value()
    assert '#report=' in shared_url
    share_context=browser.new_context();shared=share_context.new_page();share_errors=[];shared.on('pageerror',lambda e:share_errors.append(str(e)))
    shared.goto(shared_url,wait_until='networkidle');shared.keyboard.press('Escape')
    check('Shared report works in a separate browser and cannot edit the original',lambda:(expect(shared.locator('#sharedReport')).to_contain_text('1,200,000'),assert_true(shared.locator('input,textarea,[data-open-source]').count()==0),assert_true(state(shared) is None),assert_true(not share_errors)))
    share_context.close()
    page.keyboard.press('Escape');page.locator('[data-email-report]').click()
    page.locator('#emailTo').fill('director@example.com');page.locator('#emailForm button[type=submit]').click()
    check('Email saves only an explicitly addressed unsent draft',lambda:assert_true(state(page)['drafts'][0]['kind']=='email' and 'director@example.com' in state(page)['drafts'][0]['body']))
    fill_source(page,gmv='9000000')
    nav(page,'report')
    check('Later source edits cannot rewrite historical report facts',lambda:(expect(page.locator('#kpiRow')).to_contain_text('9,000,000'),expect(page.locator('#selectedReport')).to_contain_text('1,000,000'),expect(page.locator('#selectedReport')).not_to_contain_text('9,000,000')))
    attack='<img src=x onerror="window.injected=true">'
    fill_source(page,name=attack,notes=attack)
    nav(page,'world');page.locator('[data-source-evidence]').first.click()
    check('User source strings are escaped, not executed as markup',lambda:(assert_true(page.evaluate('window.injected') is None),assert_true(page.locator('#detailBody img').count()==0),expect(page.locator('#detailBody')).to_contain_text(attack)))
    page.keyboard.press('Escape');fill_source(page)
    page.locator('#searchInput').fill('转化率');page.keyboard.press('Enter')
    check('Search finds metrics and keyboard Enter navigates inspector',lambda:expect(page.locator('#inspector .entity-title')).to_have_text('转化率'))
    page.locator('#searchInput').fill('订单汇总');page.keyboard.press('ArrowDown');page.keyboard.press('Enter')
    check('Search finds source evidence, not only pages',lambda:expect(page.locator('#detailModal')).to_contain_text('订单汇总'))
    page.keyboard.press('Escape');page.locator('#searchInput').fill('');page.locator('#searchInput').press('Escape')
    layout=[];visible={}
    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
        for view in VIEWS:
            nav(page,view);details=page.locator('#view-'+view+' details')
            if details.count():details.evaluate('(e)=>e.open=true')
            dims=page.evaluate('({document:document.documentElement.scrollWidth,viewport:innerWidth,workspace:document.querySelector(".workspace").scrollWidth,client:document.querySelector(".workspace").clientWidth})')
            layout.append({'view':view,'width':width,**dims})
            assert dims['document']<=width+1 and dims['workspace']<=dims['client']+1, str(layout[-1])
            if width in [1440,390]:
                page.screenshot(path=str(OUT/f'{view}-{width}.png'),full_page=False)
                visible[f'{view}-{width}']=page.locator('body').inner_text()
        check(str(width)+'px layout across all nine expanded views',lambda:'No document/workspace overflow; tables and graph own their scroll')
    nav(page,'world');page.locator('[data-zoom="-0.1"]').click()
    check('Graph has working zoom',lambda:expect(page.locator('#zoomValue')).to_have_text('90%'))
    page.locator('[data-entity="repeat"]').click()
    check('Mobile can reach far-right graph nodes through native scrolling',lambda:expect(page.locator('#inspector .entity-title')).to_have_text('复购率'))
    leaks=['VERIFIED PERSISTED SOURCE','Reality boundary','原型内存状态','原型交互','recipient_name','Source verified','Scenario run','生产实现应','Source type','persistence provenance']
    for name,body in visible.items():assert not any(term in body for term in leaks),(name,[term for term in leaks if term in body])
    check('Known developer-only leakage regressions absent across captured views',lambda:'18 user-visible surface captures scanned; semantic review is separate')
    (OUT/'visible-copy.json').write_text(json.dumps(visible,ensure_ascii=False,indent=2))
    (OUT/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2))
    # Environmental failure injection, not a mocked business service.
    context2=browser.new_context(viewport={'width':1200,'height':900});q=context2.new_page();q.goto(URL,wait_until='networkidle');q.evaluate('(key)=>localStorage.setItem(key,"not-json")',KEY);q.reload(wait_until='networkidle');q.locator('#appMode').click()
    check('Corrupt storage is a safe empty/error state',lambda:(expect(q.locator('#sourceBanner')).to_contain_text('无法读取'),expect(q.locator('#kpiRow')).not_to_contain_text('2,483,221')))
    q.evaluate('()=>{Storage.prototype.setItem=function(){throw new DOMException("private quota trace","QuotaExceededError")};}')
    q.locator('#sourceBtn').click()
    for key,value in {'sourceName':'订单','editGmv':'100','editConversion':'5','editRoi':'4','editRepeat':'25','editEngagement':'10','editLive':'10','editRevenue':'80'}.items():q.locator('#'+key).fill(value)
    q.locator('#saveSource').click()
    check('Quota failure is visible, sanitized and cannot claim a successful save',lambda:(expect(q.locator('#sourceModal')).to_be_visible(),expect(q.locator('#sourceError')).to_contain_text('无法保存'),expect(q.locator('body')).not_to_contain_text('private quota trace'),expect(q.locator('#sourceBanner')).to_contain_text('尚无经营记录')))
    context2.close()
    check('No uncaught JavaScript or console errors',lambda:assert_true(not errors and not console,repr({'page':errors,'console':console})))
    check('No external writes, email sends, or data mutation requests',lambda:assert_true(not mutations,repr(mutations)))
    browser.close()
except Exception:
 traceback.print_exc()
 if not checks or checks[-1]["status"]!="FAIL":
  checks.append({"name":"Runtime completion", "status":"FAIL", "evidence":traceback.format_exc()})
finally:
 if server:server.terminate();server.wait(timeout=10)
 provenance={p.relative_to(ROOT/'public/business-world').as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'public/business-world/ui.html',ROOT/'public/business-world/ui.md',*sorted((ROOT/'public/business-world/src').glob('ui-*.mjs'))]}
 provenance.update({name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['tests/ui_browser.py','tests/ui-state.test.mjs','tests/ui-client.test.mjs','public/business-world/src/workbench.css','public/business-world/src/vendor/pptxgen.bundle.js']})
 report={'url':URL,'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTree':subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True),'artifactHashes':provenance,'checks':checks,'pageErrors':errors,'consoleErrors':console,'unexpectedMutations':mutations,'passed':sum(c['status']=='PASS' for c in checks),'failed':sum(c['status']=='FAIL' for c in checks)}
 (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2,default=str))
 print(json.dumps({'passed':report['passed'],'failed':report['failed'],'checks':len(checks)},ensure_ascii=False))
 if not checks or report['failed'] or checks[-1]['name']!='No external writes, email sends, or data mutation requests':raise SystemExit(1)
