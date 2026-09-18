import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const result=read('docs/concept-rebuild/browser/results.json');
const ui=read('docs/ui-audit/runtime/results.json');
const fail=[];const require=(ok,message)=>{if(!ok)fail.push(message);};
require(result.status==='PASS'&&result.passed>=37&&result.failed===0,'New task-flow browser suite incomplete');
require(result.mockedBusinessResponses===false&&result.errors.length===0,'New flows need a real browser without mocked business responses');
require(ui.passed>=61&&ui.failed===0&&ui.pageErrors.length===0&&ui.consoleErrors.length===0,'Original full UI suite incomplete');
for(const phrase of ['Browser Back','Browser Forward','actual reload','clearing context','Context flows','Product → Growth → Experiment','Experiment → Report'])require(result.checks.some(c=>c.status==='PASS'&&c.name.toLowerCase().includes(phrase.toLowerCase())),'Missing real flow: '+phrase);
for(const [path,sha] of Object.entries(result.sourceHashes))require(createHash('sha256').update(readFileSync(path)).digest('hex')===sha,'Stale task-flow evidence: '+path);
for(const view of ['overview','persona','world','content','live','growth','product','experiment','report'])for(const width of [1440,390])require(existsSync(`docs/concept-rebuild/browser/${view}-${width}.png`),'Missing per-screen evidence: '+view+' '+width);
const pair=read('public/business-world/paired-source.json');require(pair.sourceRepository==='liush2yuxjtu/business-world-agent-diaper'&&pair.mode==='runtime-owned','Pair provenance must identify this runtime-owned iteration, not falsely claim an unchanged upstream copy');
for(const file of ['src/ui-workbench.mjs','src/workbench.css'])require(Boolean(pair.files[file]),'Untracked pair source: '+file);
if(fail.length){console.error(fail.map(x=>'FAIL: '+x).join('\n'));process.exit(1);}
console.log(`PASS: ${ui.passed} original UI checks and ${result.passed} task-flow checks, current bytes and 18 per-screen screenshots.`);
const images=read('docs/concept-rebuild/image-provenance.json');
console.log(`Independent ImageGen concepts: ${images.adoptedIndependentConcepts}/${images.requestedIndependentConcepts}; this asset requirement is INCOMPLETE and is not represented as a UI test pass.`);
