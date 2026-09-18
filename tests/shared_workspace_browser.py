"""Native Playwright over a production Next server and real on-disk state.
The server lifecycle is owned here because the audit must stop/restart it and
also verify a missing-store boot. No route interception or canned API response.
"""
import hashlib, json, os, re, secrets, socket, sqlite3, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/ui-shared-audit/runtime'; OUT.mkdir(parents=True,exist_ok=True)
NODE=subprocess.check_output(['npx','--yes','--package=node@24.14.0','--','node','-p','process.execPath'],cwd=ROOT,text=True).strip()
TMP=Path(tempfile.mkdtemp(prefix='business-world-browser-'))
PASSWORD=secrets.token_urlsafe(32)
DB=TMP/'workspace.sqlite'
env=os.environ.copy()
for key in ['DATABASE_URL','VERCEL','BUSINESS_WORLD_SQLITE_PATH','BUSINESS_WORLD_PUBLIC_ORIGIN']:
    # Explicit blanks prevent Next's dotenv loader from using a developer's live configuration.
    env[key]=''
env.update(NODE_ENV='production',EVE_CHAT_PASSWORD=PASSWORD,BUSINESS_WORLD_SQLITE_PATH=str(DB),NEXT_TELEMETRY_DISABLED='1')
with socket.socket() as s:
    s.bind(('127.0.0.1',0)); PORT=s.getsockname()[1]
BASE=f'http://127.0.0.1:{PORT}'
result={'schemaVersion':1,'environment':'production Next.js server; explicit self-hosted SQLite file','agentInvocation':'actual authored eve tool executors authenticated by the existing passwordEveAuth; no language-model turn','mockedBrowserResponses':False,'manualTestInputs':True,'checks':[],'pageErrors':[],'unexpectedConsoleErrors':[],'expectedNetworkErrors':[]}
server=None;log=(OUT/'server.log').open('w'); phase='normal'
def check(name,condition=True):
    assert condition,name
    result['checks'].append({'name':name,'status':'PASS'});print('PASS',name,flush=True)
def start_server():
    global server
    server=subprocess.Popen([NODE,'node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',str(PORT)],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT)
    for _ in range(160):
        if server.poll() is not None: raise AssertionError('production server exited; inspect server.log')
        try:
            if urllib.request.urlopen(BASE+'/api/health',timeout=1).status==200:return
        except Exception:pass
        time.sleep(.15)
    raise AssertionError('production server not ready')
def stop_server():
    global server
    if server is not None:
        server.terminate()
        try:server.wait(timeout=12)
        except subprocess.TimeoutExpired:server.kill();server.wait()
        server=None

def login(page):
    page.goto(BASE+'/business-world/sign-in');page.wait_for_load_state('networkidle')
    page.locator('#password').fill(PASSWORD);page.locator('#submit').click()
    page.wait_for_url('**/business-world/workspace#app/overview');page.wait_for_load_state('networkidle')
    expect(page.locator('#sourceBanner')).to_contain_text('与当前账户的 Agent 共用记录')
def state(context):
    response=context.request.get(BASE+'/api/business-world/workspace');assert response.status==200
    return response.json()
def cookie(context):
    return '; '.join(c['name']+'='+c['value'] for c in context.cookies() if c['name']=='eve_chat_session')
def tool(context,operation,input=None,bad_cookie=False):
    payload={'cookie':'eve_chat_session=invalid' if bad_cookie else cookie(context),'operation':operation,'input':input or {}}
    completed=subprocess.run([NODE,'--import','tsx','scripts/workspace-tool-probe.ts'],cwd=ROOT,env=env,input=json.dumps(payload),capture_output=True,text=True,timeout=30)
    lines=completed.stdout.strip().splitlines()
    assert lines,'tool probe emitted no structured result'
    data=json.loads(lines[-1])
    if not bad_cookie:assert completed.returncode==0,f'actual authored tool failed: {data.get("error","unknown")}'
    return data

def fill_source(page,name,gmv=10000):
    page.locator('#sourceBtn').click();page.locator('#sourceName').fill(name);page.locator('#sourceNotes').fill('由验证操作员人工录入；不是平台观测')
    values={'editGmv':gmv,'editConversion':3,'editEngagement':400,'editRoi':2,'editRepeat':20,'editLive':200,'editRevenue':9000}
    for field,value in values.items():page.locator('#'+field).fill(str(value))

def console(message):
    if message.type!='error':return
    text=message.text
    expected=(phase=='conflict' and '409' in text) or (phase=='offline' and ('ERR_INTERNET_DISCONNECTED' in text or 'Failed to fetch' in text)) or (phase=='unavailable' and '503' in text) or (phase=='bad-login' and '401' in text)
    result['expectedNetworkErrors' if expected else 'unexpectedConsoleErrors'].append({'phase':phase,'text':text,'location':message.location})

def hashes():
    files=set()
    for folder in ['lib/business-world','app/api/business-world','app/business-world','agent/tools']:
        files.update(p for p in (ROOT/folder).rglob('*.ts') if 'mock-' not in p.name)
    files.update((ROOT/'public/business-world/src').rglob('*'))
    for relative in ['app/page.tsx','app/layout.tsx','public/business-world/ui.html','public/business-world/ui.md','public/business-world/paired-source.json','lib/session.ts','lib/eve-auth.ts','lib/password-auth.ts','lib/setup.ts','scripts/workspace-tool-probe.ts','scripts/sync-paired-ui.mjs','scripts/check-shared-audit.mjs','scripts/verify-shared.sh','tests/shared_workspace_browser.py','tests/workspace.test.ts','package.json','pnpm-lock.yaml','next.config.ts']:
        files.add(ROOT/relative)
    return {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files) if p.is_file()}

try:
    start_server()
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':1440,'height':1000})
        poison={'schemaVersion':1,'snapshot':{'id':'local-only','name':'浏览器污染来源','notes':'不得自动上传','updatedAt':'2026-09-18T00:00:00.000Z','sourceType':'manual','status':'unverified','metrics':{'gmv':999999,'conversion':99,'engagement':999,'roi':9,'repeat':99,'live':999,'revenue':99999}},'scenarios':[],'reports':[],'drafts':[],'selectedReportId':None}
        context.add_init_script("localStorage.setItem('bwa.user-workspace.v1',"+json.dumps(json.dumps(poison,ensure_ascii=False))+");")
        page=context.new_page();page.on('pageerror',lambda e:result['pageErrors'].append(str(e)));page.on('console',console)
        for endpoint in ['/api/business-world/workspace','/api/business-world/state']:
            response=context.request.get(BASE+endpoint);check('Unauthenticated read denied: '+endpoint,response.status==401 and 'DATABASE_URL' not in response.text())
        page.goto(BASE+'/business-world/sign-in');page.wait_for_load_state('networkidle')
        phase='bad-login';page.locator('#password').fill('incorrect');page.locator('#submit').click();expect(page.locator('#error')).to_have_text('密码不正确，请重试。');phase='normal'
        check('Failed login shows only actionable product copy')
        login(page);check('Actual password login establishes the shared account session')
        page.goto(BASE+'/?screen=product');page.wait_for_load_state('networkidle');expect(page.locator('#view-product')).to_be_visible()
        check('The real application home preserves deep links and uses the audited shared UI','/business-world/workspace' in page.url and page.url.endswith('#app/product'))
        page.goto(BASE+'/?screen=overview&source=1');page.wait_for_load_state('networkidle');expect(page.locator('#sourceModal')).to_be_visible();page.locator('#cancelSource').click()
        check('The former source-editor deep link opens the canonical accessible source form')
        initial=state(context)
        check('Shared mode ignores browser-local records and never auto-imports them',initial['state']['snapshot'] is None and '浏览器污染来源' not in page.locator('#sourceBanner').inner_text())
        check('Invalid Agent authentication cannot access the store',tool(context,'snapshot',bad_cookie=True).get('error')=='authentication-required')
        fill_source(page,'UI 人工经营记录');page.locator('#saveSource').click();expect(page.locator('#sourceModal')).not_to_be_visible();expect(page.locator('#sourceBanner')).to_contain_text('UI 人工经营记录')
        saved=state(context);snapshot=tool(context,'snapshot')
        check('UI save is read verbatim by the actual registered Agent snapshot tool',saved['state']['snapshot']==snapshot['workspace']['state']['snapshot'] and saved['revision']==snapshot['workspace']['revision']==1 and saved['workspaceId']==snapshot['workspace']['workspaceId'])
        check('Manual input cannot claim official or observed provenance',snapshot['provenance']['sourceMode']=='manual-unverified' and snapshot['provenance']['asOf'] is None)
        for operation,key,value in [('content','engagementCount',400),('live','views',200),('ads','roi',2),('commerce','gmv',10000)]:
            answer=tool(context,operation);check('Registered '+operation+' tool reads the same source and revision',answer['data'][key]==value and answer['provenance']['stateId']==saved['state']['snapshot']['id'] and answer['provenance']['revision']==1)
        with sqlite3.connect(DB) as db:
            row=db.execute('SELECT owner_id,revision,state FROM business_world_workspace').fetchone()
            check('Database inspection proves the exact API/Agent record exists on disk',row[0]==saved['workspaceId'] and row[1]==saved['revision'] and json.loads(row[2])==saved['state'])
        page.locator('[data-view=experiment]').first.click();page.locator('#expPrompt').fill('UI 运行广告效率情景');page.locator('#expLever').select_option('ad_efficiency');page.locator('#expChange').fill('20');page.locator('#expRun').click();expect(page.locator('#expResult')).to_contain_text('UI 运行广告效率情景')
        after_ui=tool(context,'snapshot')['workspace'];run=after_ui['state']['scenarios'][0]
        check('UI scenario is persisted and visible to the actual Agent',run['modeled']['gmv']==10700 and run['modeled']['conversion']==3 and after_ui['state']['snapshot']==saved['state']['snapshot'])
        page.locator('#expResult [data-scenario-report]').click();page.locator('#reportTitle').fill('共享经营报告');page.locator('#reportForm button[type=submit]').click();expect(page.locator('#selectedReport h2')).to_have_text('共享经营报告')
        page.locator('#reportNote').fill('人工备注独立保存');page.locator('#noteForm button[type=submit]').click();expect(page.locator('#toast')).to_contain_text('人工备注已保存')
        report_before=state(context)['state']['reports'][0]
        check('Report and separate human note persist in the same store',report_before['note']=='人工备注独立保存')
        page.locator('#selectedReport [data-info=share]').click();expect(page.locator('#detailBody')).to_contain_text('任何拿到链接的人都能读取内容');page.locator('#shareConsent').check();page.locator('#shareForm button[type=submit]').click();share_url=page.locator('#shareLink').input_value()
        recipient=browser.new_context();recipient_page=recipient.new_page();recipient_page.on('pageerror',lambda e:result['pageErrors'].append(str(e)));recipient_page.goto(share_url);recipient_page.wait_for_load_state('networkidle');expect(recipient_page.locator('#sharedReport')).to_contain_text('共享经营报告');expect(recipient_page.locator('#sharedReport')).to_contain_text('人工备注独立保存')
        check('Consented shared-workspace report copy opens in an unauthenticated browser','/business-world/ui.html#report=' in share_url and recipient_page.locator('input,textarea,form').count()==0)
        check('A portable report copy never grants access to the original workspace',recipient.request.get(BASE+'/api/business-world/workspace').status==401 and state(context)['state']['reports'][0]==report_before)
        recipient.close();page.locator('#detailModal [data-close-dialog]').first.click()
        current=state(context)
        agent_run=tool(context,'scenario',{'prompt':'Agent 创建复购情景','lever':'repeat_purchase','changePercent':10,'expectedRevision':current['revision']})
        page.locator('#refreshBtn').click();page.locator('[data-view=experiment]').first.click();expect(page.locator('#experimentHistory')).to_contain_text('Agent 创建复购情景')
        page.locator('#experimentHistory [data-run-id="'+agent_run['id']+'"]').click();expect(page.locator('#expResult')).to_contain_text('Agent 创建复购情景')
        check('Actual Agent scenario appears in the UI after a real refresh',agent_run['workspace']['revision']==current['revision']+1)
        stale_context=browser.new_context(viewport={'width':1440,'height':1000});stale=stale_context.new_page();stale.on('console',console);stale.on('pageerror',lambda e:result['pageErrors'].append(str(e)));login(stale)
        current=state(context)
        updated=tool(context,'save',{'expectedRevision':current['revision'],'sourceLabel':'Agent 人工更新','sourceType':'manual-entry','payload':{'content':{'engagementCount':450},'live':{'views':250},'commerce':{'gmv':13000,'conversionRate':3,'repeatRate':21,'revenue':11000},'ads':{'roi':2.2},'notes':'经过操作员确认的隔离测试记录'}})
        page.locator('#refreshBtn').click();expect(page.locator('#sourceBanner')).to_contain_text('Agent 人工更新')
        check('Actual Agent record write appears in the UI without a local-storage bridge',state(context)['state']['snapshot']==updated['workspace']['state']['snapshot'])
        phase='conflict';fill_source(stale,'不应覆盖的新记录',999);stale.locator('#saveSource').click();expect(stale.locator('#sourceError')).to_contain_text('记录已在其他页面或 Agent 中更新');phase='normal'
        check('A stale browser receives a useful conflict and cannot overwrite Agent changes',state(context)['state']['snapshot']['name']=='Agent 人工更新')
        stale_context.close()
        response=context.request.post(BASE+'/api/business-world/workspace',headers={'Origin':'https://untrusted.invalid'},data={'expectedRevision':state(context)['revision'],'command':{'kind':'save-draft','title':'不应执行','body':'不应执行','draftKind':'task'}})
        check('Cross-origin mutations are rejected',response.status==403)
        response=context.request.post(BASE+'/api/business-world/workspace',headers={'Origin':BASE},data={'expectedRevision':state(context)['revision'],'command':{'kind':'save-snapshot','sourceType':'official-api'}})
        check('Malformed or provenance-forging writes return sanitized errors',response.status==400 and not re.search(r'Zod|stack|schema|DATABASE_URL|sourceType',response.text()))
        check('Later Agent edits cannot rewrite report evidence',state(context)['state']['reports'][0]==report_before)
        phase='offline';context.set_offline(True);page.locator('#refreshBtn').click();expect(page.locator('#sourceBanner')).to_contain_text('暂时无法连接工作区');check('Offline refresh shows failure, preserves the record and never claims success','Agent 人工更新' in page.locator('#sourceBanner').inner_text());context.set_offline(False);phase='normal';page.locator('#refreshBtn').click();expect(page.locator('#sourceBanner')).not_to_contain_text('暂时无法连接工作区')
        before_restart=state(context);stop_server();start_server();page.reload();page.wait_for_load_state('networkidle');expect(page.locator('#sourceBanner')).to_contain_text('Agent 人工更新')
        check('The complete shared state survives a real server-process restart',state(context)==before_restart)
        second=browser.new_context();second_page=second.new_page();login(second_page);check('A separately authenticated browser reads the same durable workspace',state(second)==before_restart);second.close()
        phase='unavailable';stop_server();env['BUSINESS_WORLD_SQLITE_PATH']='';start_server();page.reload();page.wait_for_load_state('networkidle');expect(page.locator('#sourceBanner')).to_contain_text('暂时无法连接工作区')
        check('Missing storage fails visibly without local or remote fallback',not re.search(r'DATABASE_URL|Supabase|schemaReady|Stack trace',page.locator('body').inner_text()) and '尚无经营记录' not in page.locator('#sourceBanner').inner_text())
        page.locator('#appNav [data-view=world]').click();page.locator('.node[data-entity=gmv]').click()
        result['unavailableInteractionEvidence']={'metric':page.locator('#inspector').inner_text(),'banner':page.locator('#sourceBanner').inner_text()}
        page.screenshot(path=str(OUT/'unavailable-metric.png'),full_page=True)
        check('Unavailable workspace remains unknown after a real metric click','暂时无法读取工作区记录' in page.locator('#inspector').inner_text() and '暂无记录' not in page.locator('#inspector').inner_text())
        page.locator('.evidence [data-source-evidence]').click()
        result['unavailableInteractionEvidence']['source']=page.locator('#detailBody').inner_text()
        page.screenshot(path=str(OUT/'unavailable-source.png'),full_page=True)
        check('Unavailable source inspection never claims the store is empty','暂时无法读取工作区记录' in page.locator('#detailBody').inner_text() and '尚未添加经营记录' not in page.locator('#detailBody').inner_text())
        page.locator('#detailModal').get_by_role('button',name='关闭详情',exact=True).click();page.locator('#sourceBtn').click()
        check('Source editing waits for a successful workspace read',not page.locator('#sourceModal').is_visible() and '暂时无法读取工作区记录' in page.locator('#toast').inner_text())
        page.locator('#appNav [data-view=report]').click();page.locator('[data-new-report]').click()
        check('Report creation preserves unknown rather than inventing missing baseline',not page.locator('#sourceModal').is_visible() and not page.locator('#detailModal').is_visible() and '暂时无法读取工作区记录' in page.locator('#toast').inner_text())
        page.locator('#appNav [data-view=experiment]').click();page.locator('#expPrompt').fill('连接恢复后再比较');page.locator('#expRun').click()
        check('Scenario action cannot turn unavailable state into a no-baseline claim','暂时无法读取工作区记录' in page.locator('#expResult').inner_text() and '请先添加经营记录' not in page.locator('#expError').inner_text())
        page.locator('#appNav [data-view=overview]').click();page.locator('#view-overview .page-records [data-new-draft]').click()
        check('Draft creation waits for a successful workspace read',not page.locator('#detailModal').is_visible() and '暂时无法读取工作区记录' in page.locator('#toast').inner_text())
        stop_server();env['BUSINESS_WORLD_SQLITE_PATH']=str(DB);start_server();phase='normal';page.reload();page.wait_for_load_state('networkidle');expect(page.locator('#sourceBanner')).to_contain_text('Agent 人工更新')
        captures={}
        for width,height in [(1440,1000),(390,844)]:
            page.set_viewport_size({'width':width,'height':height})
            for view in ['overview','persona','world','content','live','growth','product','experiment','report']:
                page.goto(BASE+'/business-world/workspace#app/'+view);page.wait_for_load_state('networkidle')
                expect(page.locator('#sourceBanner')).to_contain_text('Agent 人工更新')
                if view=='experiment':expect(page.locator('#expResult')).to_contain_text('从已保存的记录中选择一个情景')
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'{view} overflows {width}'
                text=page.locator('body').inner_text();captures[f'{width}-{view}']=text
                assert not re.search(r'DATABASE_URL|schemaReady|MCP payload|intent-audit|developer-audit|agent_internal|console\.log',text),f'Internal text leaked on {view}'
                page.screenshot(path=str(OUT/f'{width}-{view}.png'),full_page=True)
            check(f'All nine shared views have readable layout and safe product copy at {width}px')
        (OUT/'visible-copy.json').write_text(json.dumps(captures,ensure_ascii=False,indent=2))
        stored=page.evaluate("localStorage.getItem('bwa.user-workspace.v1')")
        check('Shared operations never silently rewrite or upload the separate local workspace',json.loads(stored)==poison)
        with sqlite3.connect(DB) as db:
            result['databaseEvidence']={'integrity':db.execute('PRAGMA integrity_check').fetchone()[0],'rows':db.execute('SELECT count(*) FROM business_world_workspace').fetchone()[0],'revision':db.execute('SELECT revision FROM business_world_workspace').fetchone()[0]}
        check('Database integrity is OK after UI, Agent, conflict and restart flows',result['databaseEvidence']['integrity']=='ok')
        check('No uncaught JavaScript errors or unexpected console errors',not result['pageErrors'] and not result['unexpectedConsoleErrors'])
        browser.close()
    result['status']='PASS'
except Exception as error:
    result['status']='FAIL';result['failure']=str(error);print('FAIL',str(error),flush=True)
    try:page.screenshot(path=str(OUT/'failure.png'),full_page=True)
    except Exception:pass
    raise
finally:
    stop_server();log.close();result['sourceHashes']=hashes();result['sourceDigest']=hashlib.sha256(json.dumps(result['sourceHashes'],sort_keys=True).encode()).hexdigest();result['passed']=len(result['checks']);(OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':result.get('status'),'passed':result['passed'],'sourceDigest':result['sourceDigest']}),flush=True)
