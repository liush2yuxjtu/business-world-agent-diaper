import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workspaceMutation,createWorkspaceClient} from '../public/business-world/src/ui-client.mjs';
import {emptyState,createSnapshot,calculateScenario,createReport,normalizeState,makeId} from '../public/business-world/src/ui-state.mjs';
const metrics={gmv:10000,conversion:3,engagement:400,roi:2,repeat:20,live:200,revenue:9000};
const snapshot=createSnapshot('人工经营记录','未核验',metrics);
const before={...emptyState(),snapshot};

test('source edits send only source fields, never client identity/provenance or histories',()=>{
 const edited=createSnapshot('新的人工记录','备注',{...metrics,gmv:12000});
 assert.deepEqual(workspaceMutation(before,{...before,snapshot:edited}),{kind:'save-snapshot',name:edited.name,notes:edited.notes,metrics:edited.metrics});
});
test('scenario command contains assumptions, never a client-supplied result',()=>{
 const scenario=calculateScenario(snapshot,'ad_efficiency',20,'效率提升');
 assert.deepEqual(workspaceMutation(before,{...before,scenarios:[scenario]}),{kind:'run-scenario',lever:'ad_efficiency',change:20,prompt:'效率提升'});
});
test('report command refers to the server scenario without copying historical facts',()=>{
 const scenario=calculateScenario(snapshot,'repeat_purchase',10,'复购比较');
 const source={...before,scenarios:[scenario]};const report=createReport('报告',snapshot,scenario);
 assert.deepEqual(workspaceMutation(source,{...source,reports:[report],selectedReportId:report.id}),{kind:'create-report',title:'报告',scenarioId:scenario.id});
});
test('human notes are the only editable report field in a save-note command',()=>{
 const report=createReport('报告',snapshot);const source={...before,reports:[report],selectedReportId:report.id};
 assert.deepEqual(workspaceMutation(source,{...source,reports:[{...report,note:'人工意见'}]}),{kind:'save-note',reportId:report.id,note:'人工意见'});
});
test('draft commands cannot masquerade as a publish, send or budget action',()=>{
 const draft={id:makeId(),title:'发布计划',body:'发布前仍需确认',kind:'plan',createdAt:new Date().toISOString()};
 assert.deepEqual(workspaceMutation(before,{...before,drafts:[draft]}),{kind:'save-draft',title:draft.title,body:draft.body,draftKind:'plan'});
});
test('report selection sends the selected identity only',()=>{
 const report=createReport('报告',snapshot),source={...before,reports:[report]};
 assert.deepEqual(workspaceMutation(source,{...source,selectedReportId:report.id}),{kind:'select-report',reportId:report.id});
});
test('unrecognized history replacement has no write command',()=>{
 const scenario=calculateScenario(snapshot,'ad_efficiency',20,'效率提升');
 assert.throws(()=>workspaceMutation({...before,scenarios:[scenario]},before),error=>error.code==='invalid-command');
});
test('workspace endpoint cannot come from an external URL or an arbitrary path',()=>{
 for(const endpoint of ['https://untrusted.invalid/upload','//untrusted.invalid/upload','/api/other','/api/business-world/workspace?owner=other'])assert.throws(()=>createWorkspaceClient({endpoint}),error=>error.code==='invalid-endpoint');
});
test('shared client cannot write before reading its authenticated workspace',async()=>{
 const client=createWorkspaceClient({endpoint:'/api/business-world/workspace'});
 await assert.rejects(()=>client.save(emptyState(),before),error=>error.code==='connection-unavailable');
 assert.equal(client.ready,false);assert.equal(client.workspaceId,null);
});
test('same-ID but altered report evidence is rejected as a baseline mismatch',()=>{
 const scenario=calculateScenario(snapshot,'ad_efficiency',20,'效率提升');
 const report=createReport('报告',snapshot,scenario);
 for(const changed of [{...report.baseline,name:'伪造来源'},{...report.baseline,metrics:{...metrics,gmv:50000}}]){
  assert.equal(changed.id,report.scenario.baseline.id);
  assert.throws(()=>normalizeState({...before,reports:[{...report,baseline:changed}]}),error=>error.code==='report-baseline-mismatch');
 }
});
