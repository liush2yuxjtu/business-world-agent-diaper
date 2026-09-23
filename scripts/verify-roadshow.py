"""Real browser acceptance for the shared World Model and roadshow surfaces."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree
from zipfile import ZipFile
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://localhost:3139')
parser.add_argument('--output', default='docs/verification/roadshow')
parser.add_argument('--channel', default='chrome')
args = parser.parse_args()
base = args.base_url.rstrip('/')
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
catalog = json.loads(Path('lib/roadshow/catalog.json').read_text())
manifest = json.loads(Path('public/roadshow-assets/manifest.json').read_text())
report = {'baseUrl': base, 'checkedAt': datetime.now(timezone.utc).isoformat(), 'checks': [], 'result': 'FAIL', 'errors': []}

def passed(name, **evidence):
    report['checks'].append({'name': name, 'result': 'PASS', **evidence})
    print('PASS', name, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel=args.channel)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    page = context.new_page()
    page_errors = []
    page.on('pageerror', lambda error: page_errors.append(str(error)))
    try:
        response = context.request.get(base + '/api/business-world/state')
        assert response.status == 200
        snapshot = response.json()
        assert snapshot['data'] and snapshot['provenance']['writable']
        passed('Database snapshot', source=snapshot['provenance'], personas=len(snapshot['data']['personas']))
        for asset in manifest['assets']:
            res = context.request.get(base + asset['path'])
            assert res.status == 200, asset['path']
            doc = ElementTree.fromstring(res.body())
            assert doc.tag.endswith('svg') and doc.attrib['viewBox'] == asset['viewBox']
            assert b'<script' not in res.body() and b'http://' not in res.body().replace(b'http://www.w3.org/2000/svg', b'')
        passed('All shared SVG assets', count=len(manifest['assets']))
        for route in ['/world', '/landing', '/roadshow', '/roadshow-assets', '/?screen=world']:
            response = page.goto(base + route, wait_until='networkidle')
            assert response.status == 200
            assert page.locator('.wm').count()
            text = page.locator('body').inner_text()
            assert not re.search(r'potato|poteto|西红柿模式|发现问题效率|沟通效率', text, re.I)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), route
            name = route.strip('/').replace('?screen=', 'product-') or 'home'
            page.screenshot(path=str(out / (name + '-desktop.png')), full_page=False)
        passed('Five integrated desktop surfaces')
        page.goto(base + '/world', wait_until='networkidle')
        for group in ['consumer', 'business']:
            page.get_by_role('button', name='家庭与消费者' if group == 'consumer' else '业务伙伴', exact=True).click()
            for persona in [person for person in catalog['personas'] if person['group'] == group]:
                page.locator('.wm-persona-orbit').get_by_role('button', name=re.compile('^' + persona['name'])).click()
                expect(page.locator('.wm-persona-detail h2')).to_have_text(persona['name'])
                if persona['sourceId']:
                    expect(page.locator('.wm-persona-detail')).to_contain_text('数据库人群')
                else:
                    expect(page.locator('.wm-persona-detail')).to_contain_text('角色模板')
        passed('Sixteen persona selections and provenance labels')
        page.get_by_label('搜索世界角色').fill('品质')
        page.locator('.wm-search-results').get_by_role('button', name='品质敏感家庭').click()
        expect(page.locator('.wm-persona-detail h2')).to_have_text('品质敏感家庭')
        page.get_by_label('区域模板').select_option('europe')
        expect(page.locator('.wm-entity-context')).to_contain_text('欧洲')
        for entity in catalog['entities']:
            page.locator('.wm-entity-strip').get_by_role('button', name=entity['name'], exact=True).click()
            expect(page.locator('.wm-entity-context b')).to_have_text(entity['name'])
        passed('Search, region templates and ten commercial entities')
        for event in catalog['events']:
            page.locator('.wm-events').get_by_role('button', name=re.compile('^' + event['name'])).click()
            expect(page.locator('.wm-event-detail h3')).to_have_text(event['name'])
        page.locator('.wm-events').get_by_role('button', name=re.compile('^库存覆盖偏低')).click()
        for product in snapshot['data']['commerce']['products']:
            if product['stockDays'] <= 7:
                expect(page.locator('.wm-event-detail')).to_contain_text(f"{product['name']}：库存覆盖 {product['stockDays']} 天")
        passed('Eight event selections and database-backed stock rule')
        for scenario in catalog['scenarios']:
            page.locator('.wm-scenario-grid').get_by_role('button', name=re.compile('^' + scenario['name'])).click()
            expect(page.locator('.wm-run-form h3')).to_contain_text(scenario['leverName'])
            expect(page.get_by_label('变化幅度', exact=True)).to_have_value(str(scenario['change']))
        passed('Eight scenario templates map to existing Product Demo levers')
        page.get_by_label('变化幅度', exact=True).fill('201')
        page.get_by_role('button', name='运行并保存情景', exact=True).click()
        expect(page.locator('.wm-status')).to_contain_text('-80 到 200')
        passed('Invalid hypothesis rejected without a write')
        page.locator('.wm-scenario-grid').get_by_role('button', name=re.compile('^渠道投放')).click()
        page.get_by_label('业务假设', exact=True).fill('路演验收：比较投放效率提升 10% 的方向性影响')
        page.get_by_label('变化幅度', exact=True).fill('10')
        page.get_by_role('button', name='运行并保存情景', exact=True).click()
        expect(page.locator('.wm-status')).to_contain_text('数据库已保存并读回验证', timeout=45000)
        run_id = page.locator('[data-run-id]').get_attribute('data-run-id')
        res = context.request.get(base + '/api/business-world/scenario?id=' + run_id)
        assert res.status == 200
        run = res.json()
        assert run['id'] == run_id and run['changePercent'] == 10 and run['lever'] == 'ad_efficiency'
        assert run['result']['modeledRoi'] == round(snapshot['data']['ads']['roi'] * 1.1, 2)
        assert run['result']['modeledConversionRate'] == round(snapshot['data']['commerce']['conversionRate'] * 1.1, 2)
        page.locator('.wm-runner').scroll_into_view_if_needed()
        page.locator('.wm-runner').screenshot(path=str(out / 'scenario-saved.png'))
        page.reload(wait_until='networkidle')
        expect(page.locator('[data-run-id]')).to_have_attribute('data-run-id', run_id, timeout=30000)
        history = context.request.get(base + '/api/business-world/scenario').json()['runs']
        assert any(item['id'] == run_id for item in history)
        report['savedRun'] = run
        passed('Real write, targeted readback, correct result and reload persistence', id=run_id)
        page.goto(base + '/landing', wait_until='networkidle')
        expect(page.get_by_role('button', name='运行并保存情景', exact=True)).to_be_enabled(timeout=30000)
        page.locator('video').evaluate('(video) => { video.muted = true; return video.play(); }')
        page.wait_for_function('document.querySelector("video").currentTime > 0.2')
        video = page.locator('video').evaluate('(video) => ({duration:video.duration, width:video.videoWidth, height:video.videoHeight})')
        assert video['width'] > 0 and video['height'] > 0 and video['duration'] > 0
        page.locator('video').evaluate('(video) => video.pause()')
        passed('Recorded real demo decodes and plays', **video)
        context.set_offline(True)
        page.get_by_role('button', name='运行并保存情景', exact=True).click()
        expect(page.locator('.wm-status.error')).to_be_visible(timeout=35000)
        assert page.locator('[data-run-id]').count() == 0
        context.set_offline(False)
        passed('Network failure cannot display a saved result')
        assert context.request.get(base + '/api/business-world/scenario?id=bad-id').status == 400
        assert context.request.get(base + '/api/business-world/scenario?id=00000000-0000-4000-8000-000000000000').status == 404
        forbidden = context.request.post(base + '/api/business-world/scenario', headers={'Origin':'https://example.org'}, data={'prompt':'test','lever':'ad_efficiency','changePercent':10})
        assert forbidden.status == 403
        passed('Record validation and cross-origin write protection')
        page.goto(base + '/roadshow-assets', wait_until='networkidle')
        page.get_by_role('button', name='客户画像', exact=True).click()
        assert page.locator('.wm-asset').count() == 9
        page.get_by_role('button', name='全部', exact=True).click()
        assert page.locator('.wm-asset').count() == len(manifest['assets'])
        passed('Asset workbench filters')
        with page.expect_download() as download:
            page.get_by_role('link', name='下载全部资产', exact=True).click()
        with ZipFile(download.value.path()) as archive:
            assert archive.testzip() is None
            assert len([name for name in archive.namelist() if name.endswith('.svg')]) == len(manifest['assets'])
            assert 'fonts/OFL.txt' in archive.namelist()
        with page.expect_download() as download:
            page.get_by_role('link', name='下载 PPT', exact=True).click()
        ppt_hash = hashlib.sha256(Path(download.value.path()).read_bytes()).hexdigest()
        assert ppt_hash == hashlib.sha256(Path('public/roadshow-assets/business-world-roadshow.pptx').read_bytes()).hexdigest()
        passed('ZIP and PPT browser downloads match delivered assets', pptSha256=ppt_hash)
        for screen in ['overview','persona','world','content','live','growth','product','experiment','report']:
            page.goto(base + '/?screen=' + screen, wait_until='networkidle')
            expect(page.locator('.source-banner')).to_contain_text('Demo 数据库', timeout=30000)
            assert '数据暂时不可用' not in page.locator('body').inner_text()
        passed('Nine existing Product Demo screens still load')
        page.set_viewport_size({'width':390,'height':844})
        for route in ['/world','/landing','/roadshow','/roadshow-assets','/?screen=world']:
            page.goto(base+route,wait_until='networkidle')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), route
            page.screenshot(path=str(out / (route.strip('/').replace('?screen=','product-')+'-mobile.png')),full_page=True)
        page.goto(base + '/world',wait_until='networkidle')
        page.locator('.wm-persona-orbit').get_by_role('button',name=re.compile('^精打细算家庭')).click()
        expect(page.locator('.wm-persona-detail h2')).to_have_text('精打细算家庭')
        passed('Five mobile surfaces, no horizontal overflow, usable persona selection')
        assert not page_errors, page_errors
        passed('No browser runtime errors')
        report['result'] = 'PASS'
    except Exception as error:
        report['errors'].append(str(error))
        report['browserErrors'] = page_errors
        page.screenshot(path=str(out/'failure.png'),full_page=True)
        raise
    finally:
        (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        context.close()
        browser.close()
print(json.dumps({'result':report['result'],'checks':len(report['checks']),'report':str(out/'report.json')},ensure_ascii=False))
