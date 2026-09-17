#!/usr/bin/env python3
import json, pathlib, re, sys, time
sys.path.insert(0, '/Users/liushiyu/Services/macmini-playwright-runner')
from browser import ensure, request

url = sys.argv[1]
state = ensure()
session = state['sessionId']
out_dir = pathlib.Path('/Users/liushiyu/Services/macmini-playwright-runner/runs') / session
out_dir.mkdir(parents=True, exist_ok=True)

def call(name, args=None):
    r = request({'action':'call','name':name,'arguments':args or {}})
    if r.get('error') or r.get('isError'):
        raise RuntimeError(f'{name}: {r}')
    return '\n'.join(x.get('text','') for x in r.get('content',[]))

def snapshot():
    return call('browser_snapshot')

def click_named(label):
    s = snapshot()
    m = re.search(rf'button "{re.escape(label)}" \[ref=(\w+)\]', s)
    if not m:
        raise AssertionError(f'button not found: {label}')
    call('browser_click', {'target':m.group(1),'element':label})
    return snapshot()

result = {'status':'FAIL','sessionId':session,'url':url,'checks':{},'startedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
try:
    call('browser_navigate', {'url':url})
    s = snapshot()
    assert 'Business World Agent' in s and 'NO VERIFIED SOURCE' in s
    result['checks']['initialTruthState'] = True

    expected = {
      '总览':'heading "总览"', 'Persona Studio':'heading "Persona Studio"', 'World Builder':'heading "World Builder"',
      '内容策略':'heading "内容策略"', '直播作战室':'heading "直播作战室"', '投放优化':'heading "投放优化"',
      '商品分析':'heading "商品分析"', '模拟实验':'heading "模拟实验"', '报告':'heading "报告"'
    }
    for label, marker in expected.items():
        s = click_named(label)
        assert marker in s, (label, marker)
    result['checks']['nineNavigationSurfaces'] = True

    click_named('总览')
    s = click_named('开始模拟')
    assert 'Scenario Experiment' in s
    result['checks']['startSimulationNavigation'] = True

    click_named('总览')
    s = snapshot()
    m = re.search(r'textbox "搜索功能" \[ref=(\w+)\]', s)
    assert m
    call('browser_fill_form', {'fields':[{'target':m.group(1),'name':'搜索功能','type':'textbox','value':'直播'}]})
    search_info = call('browser_evaluate', {'function':'() => ({results:[...document.querySelectorAll(".search-results button")].map(x=>x.textContent?.trim())})'})
    assert '直播作战室' in search_info
    result['checks']['search'] = True

    # Clear search by returning to overview through the sidebar and open data editor.
    click_named('总览')
    s = click_named('数据源')
    assert '连接真实 Business World 数据' in s and '保存真实快照' in s
    result['checks']['dataEditorOpens'] = True
    modal = call('browser_evaluate', {'function':'() => ({open:!!document.querySelector(".data-editor"), fields:document.querySelectorAll(".data-editor input").length})'})
    assert '"open": true' in modal.lower() and re.search(r'"fields":\s*1[0-9]', modal)
    result['checks']['dataEditorFields'] = True

    api = call('browser_evaluate', {'function':'async () => { const h=await fetch("/api/health"); const s=await fetch("/api/business-world/state"); return {health:{status:h.status,body:await h.json()},state:{status:s.status,body:await s.json()}} }'})
    assert '"status": 200' in api and '"sourceMode": "unavailable"' in api and '"configured": false' in api
    result['checks']['apiTruthBoundary'] = True
    result['runtimeApi'] = api

    console = call('browser_console_messages', {'level':'error'})
    # MCP emits a summary even when none exist; only fail on recognizable app errors.
    assert 'PostHog was initialized without a token' not in console
    result['checks']['noPosthogConfigError'] = True
    result['consoleErrors'] = console

    call('browser_take_screenshot', {'scale':'css','fullPage':True,'filename':'business-world-reality-final.png'})
    result['checks']['screenshot'] = True
    result['status'] = 'PASS'
except Exception as exc:
    result['error'] = repr(exc)
finally:
    result['finishedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    path = out_dir / 'business-world-reality-audit.json'
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result['status']=='PASS' else 1)
