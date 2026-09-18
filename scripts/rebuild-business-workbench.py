"""Apply the bounded workbench redesign to the inspected PR14 UI, fail on drift.
Only presentation and contextual navigation change. No state, auth, store,
registered-agent, financial calculation or external-write implementation changes.
"""
import hashlib, json, shutil, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public/business-world'
OUT=ROOT/'docs/concept-rebuild'
OUT.mkdir(parents=True,exist_ok=True)
def once(text,before,after):
    if text.count(before)!=1:raise RuntimeError('Expected exactly one inspected integration anchor: '+before[:100])
    return text.replace(before,after,1)
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

runtime_path=PUBLIC/'src/ui-runtime.mjs'
runtime=runtime_path.read_text()
if "from './ui-workbench.mjs'" not in runtime:
    runtime="import {SCREENS,renderRecordSurface,syncWorkbench,draftSeed} from './ui-workbench.mjs';\n"+runtime
    runtime=once(runtime,'let toastTimer;','let toastTimer;\nconst handoffContext=Object.create(null);')
    start=runtime.index('function renderBusinessPages(){')
    end=runtime.index('function renderDrafts(){',start)
    runtime=runtime[:start]+'''function renderBusinessPages(){
 for(const id of Object.keys(summaries)){
  const record=$('#view-'+id+' .page-records');
  record.innerHTML=renderRecordSurface(id,state,{unknown:workspaceReadPending(),place});
 }
 renderDrafts();
}
'''+runtime[end:]
    runtime=once(runtime,'function showFlowContext(context){','function showFlowContext(context){\n handoffContext[view]=String(context).slice(-600);context=handoffContext[view];')
    runtime=once(runtime,'renderSource();renderBusinessPages();renderWorld();renderExperimentResult();renderReports();','renderSource();renderBusinessPages();renderWorld();renderExperimentResult();renderReports();syncWorkbench(view);')
    runtime=once(runtime,"if(route&&location.hash!=='#app/'+id)history.replaceState(null,'','#app/'+id);","if(route&&location.hash!=='#app/'+id)history.pushState(null,'','#app/'+id);\n syncWorkbench(id);if(handoffContext[id])showFlowContext(handoffContext[id]);")
    new_handlers=''' if(target.matches('[data-handoff]')){
  const origin=SCREENS[target.dataset.origin]?target.dataset.origin:view,destination=target.dataset.handoff;
  if(!SCREENS[destination])return;
  const prior=handoffContext[origin];
  const source=workspaceReadPending()?'经营来源暂时无法读取':state.snapshot?'经营来源：'+state.snapshot.name:'经营来源待补充';
  if($('#detailModal').open)$('#detailModal').close();
  setView(destination);showFlowContext([prior,'来自'+SCREENS[origin].label,source].filter(Boolean).join(' · '));return;
 }
 if(target.matches('[data-work-draft]')){
  if(!requireWorkspaceRead())return;
  const origin=SCREENS[target.dataset.origin]?target.dataset.origin:view,kind=target.dataset.workDraft;
  const context=[handoffContext[view],state.snapshot?'经营来源：'+state.snapshot.name:'经营来源待补充'].filter(Boolean).join(' · ');
  const seed=draftSeed(origin,kind,target.dataset.purpose??'',context);openDraft(kind,seed.title,seed.body);return;
 }
 if(target.matches('[data-open-examples]')){
  const route=target.dataset.openExamples;if(!SCREENS[route])return;
  const examples=$('#view-'+route+' .example-catalog');if(examples){examples.open=true;examples.scrollIntoView({block:'start',behavior:'auto'});}return;
 }
'''
    runtime=once(runtime," if(target.matches('[data-view]')){",new_handlers+" if(target.matches('[data-view]')){")
    runtime=once(runtime,"if(target.matches('[data-simulate]')){const key=", "if(target.matches('[data-simulate]')){const origin=view;const key=")
    runtime=once(runtime,"setView('experiment');return;}\n if(target.matches('[data-watch]'))", "setView('experiment');showFlowContext(['来自'+SCREENS[origin].label,handoffContext[origin],workspaceReadPending()?'经营来源暂时无法读取':state.snapshot?'经营来源：'+state.snapshot.name:'经营来源待补充'].filter(Boolean).join(' · '));return;}\n if(target.matches('[data-watch]'))")
    runtime+= "\nwindow.addEventListener('popstate',()=>{if(!document.querySelector('#app'))return;const id=routeFromHash();if(id)setView(id,false);else if(location.hash==='#landing')setMode('landing');});\n"
    runtime_path.write_text(runtime)

html_path=PUBLIC/'ui.html';html=html_path.read_text()
if 'ui-workbench.css' not in html:
    html=once(html,'</head>','<link rel="stylesheet" href="./src/ui-workbench.css">\n</head>')
    html=once(html,'<header class="topbar">','<header class="topbar">\n        <div class="screen-breadcrumb">母婴经营工作台 / <strong id="currentScreen">经营总览</strong></div>')
    html_path.write_text(html)

module_path=PUBLIC/'src/ui-workbench.mjs';module=module_path.read_text()
if "b.setAttribute('aria-label',s.label" not in module:
    module=once(module,"b.title=s.label+' · '+s.en;", "b.title=s.label+' · '+s.en;b.setAttribute('aria-label',s.label+' / '+s.en);")
    module_path.write_text(module)

md_path=PUBLIC/'ui.md';md=md_path.read_text()
marker='## Browser-rendered workbench redesign — 2026-09-18'
if marker not in md:
    md=md.replace('Updated from the latest ImageGen visual exploration on 2026-09-18.','Updated from browser-rendered visual exploration on 2026-09-18.')
    addition='''
## Browser-rendered workbench redesign — 2026-09-18

This branch changes the visual layout and contextual navigation of the nine existing business screens. No image-gen is used. Earlier execution-status sections describe the inherited candidate; they are not evidence that this redesign has passed. Current evidence is `docs/concept-rebuild/results.json` plus the independently rerun `docs/ui-shared-audit/runtime/results.json`. Missing or failing results are not PASS.

- Each screen has one browser-rendered PNG in `public/business-world/concepts/`, a clear primary action and accessible navigation.
- Persona → content carries the source and research context; confirmed content briefs can become separately confirmed plans.
- Product → growth → experiment carries context and preselects the appropriate lever. Browser Back/Forward preserves actual route navigation.
- Experiments retain immutable baselines; reports retain selected evidence; notes remain separate. Publishing, budget changes and email delivery are not executed.
- Empty, manual/unverified, illustrative, simulated and unavailable states remain distinct. No platform is shown as connected without evidence.
- Original §17 and §19 contracts remain mandatory. The existing 40-check authenticated shared-runtime suite is not removed or weakened.
- The runtime pair is maintained here alongside `docs/design-handoff/ui.html` and `ui.md`. `world-agent-interactive` is the historical design-source repository, not silently modified by this branch.
- Penpot receives an import manifest and PNG assets only. No claim is made that a remote Penpot file was edited.
- Production, cloud-provider availability and a live language-model turn remain outside these browser checks. The inherited standalone `eve build` blocker is not treated as passed by the Next production build.

'''
    split=md.find('\n## Execution status')
    md=md[:split]+ '\n'+addition+md[split:] if split>=0 else md+'\n'+addition
    md_path.write_text(md)

files=['ui.html','ui.md']+[str(p.relative_to(PUBLIC)) for p in sorted((PUBLIC/'src').rglob('*')) if p.is_file()]
manifest={'sourceRepository':'liush2yuxjtu/business-world-agent-diaper','sourcePath':'public/business-world','historicalDesignRepository':'liush2yuxjtu/world-agent-interactive','upstreamCommit':'cc49af3c8e4122755f53d283ccd65256076de0ad','files':{name:digest(PUBLIC/name) for name in files}}
(PUBLIC/'paired-source.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
handoff=ROOT/'docs/design-handoff';handoff.mkdir(parents=True,exist_ok=True)
for filename in ['ui.html','ui.md']:shutil.copyfile(PUBLIC/filename,handoff/filename)
shutil.copytree(PUBLIC/'src',handoff/'src',dirs_exist_ok=True)

(OUT/'DESIGN.md').write_text('''# Business World Agent workbench design

## Product scope
Nine actual screens: overview, persona, world, content, live, growth, product, experiment, report. Do not add global market discovery, investing, social communities, project-management modules or other unrelated features from earlier concept boards.

## Visual language
Use the existing blue-and-white direction with a quiet pale-blue sidebar, one blue primary action per hero, legible dark-blue text, spacious 12–18px cards, and system Chinese fonts. CSS geometry is decorative only. No image-generation service is used. The original product records, source status and capability boundaries determine the visible facts.

## Layout
The shared shell contains navigation, search and source controls. Each screen has a distinct page title, primary task, contextual journey bar and domain-specific actions. Overview shows only recorded metrics and counts of real saved work. Persona asks for evidence instead of inventing a population. World keeps the interactive graph and inspector. Experiments and reports use side-by-side working layouts on large screens and a single column on smaller screens.

## Responsive and accessibility contracts
Verify 1440, 768, 390 and 320px widths. Small screens use a horizontally scrollable labelled navigation bar rather than unexplained icons. Tables and the graph scroll inside bounded regions, never by overflowing the page. Preserve visible focus, dialog labels, Escape, keyboard search and reduced motion. Preserve all nine deep links.

## Evidence and semantics
Blank is not zero; unavailable is not empty; manual is not verified; a template is not an observed population; a scenario is not a calibrated forecast; a saved draft is not a sent email or deployed campaign. Do not display invented channel connections, trend lines or deltas.

## Design and verification references
- Reviewed: https://github.com/VoltAgent/awesome-claude-design. Reuse the token/layout/rationale structure, not an unrelated brand clone.
- Reviewed: https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md. Use native Python Playwright, real browser DOM, HTTP serving, explicit waits and executable evidence.
- Existing `design-system/` tokens remain the reference; workbench presentation overrides live in `public/business-world/src/ui-workbench.css`.

## Acceptance
Nine separate PNGs; actual connected user journeys; no image-gen; no mocked business responses; original authenticated persistence/error regressions retained; source-hash-bound evidence; final human review before merge.
''')
(OUT/'source-provenance.json').write_text(json.dumps({'baseCommit':'cc49af3c8e4122755f53d283ccd65256076de0ad','imageGenerationUsed':False,'integration':'presentation module plus bounded navigation hooks; state/auth/store/calculation modules unchanged','sourceHashes':manifest['files']},ensure_ascii=False,indent=2)+'\n')
concepts=PUBLIC/'concepts';concepts.mkdir(parents=True,exist_ok=True)
(concepts/'README.md').write_text('# One browser-rendered concept per screen\n\nRun `python tests/concept_workbench_browser.py` to produce the nine PNGs and the review gallery. The script uses the real UI and explicitly labelled manual design-review records. No image-gen is used. The screenshots are review artifacts, not evidence of real sales or connected platforms.\n\nThe presence of this README alone does not mean rendering or verification has completed; use the generated manifest and current test results.\n')
print('Integrated nine-screen workbench presentation and contextual handoffs; preserved state, auth, store and calculations.')
print('Updated exact paired source hashes. Browser verification and concept rendering must still pass.')
