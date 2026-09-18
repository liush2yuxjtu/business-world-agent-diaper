/** Business World UI state boundary. No provider credentials or internal artifacts are accepted. */
export const STORAGE_KEY = 'bwa.user-workspace.v1';
export const METRICS = Object.freeze({
  gmv: {label:'GMV',max:1e12,unit:'元'}, conversion:{label:'转化率',max:100,unit:'%'},
  engagement:{label:'内容互动量',max:1e12,unit:'次',integer:true}, roi:{label:'广告投入产出比',max:1e6,unit:''},
  repeat:{label:'复购率',max:100,unit:'%'}, live:{label:'直播观看量',max:1e12,unit:'人次',integer:true},
  revenue:{label:'收入',max:1e12,unit:'元'}
});
export const LEVERS = Object.freeze({
  ad_efficiency:{label:'广告效率',metric:'roi',elasticity:0.35},
  checkout_conversion:{label:'结账转化率',metric:'conversion',elasticity:1},
  content_engagement:{label:'内容互动量',metric:'engagement',elasticity:0.25},
  repeat_purchase:{label:'复购率',metric:'repeat',elasticity:0.4}
});
export class StateError extends Error { constructor(code){super(code);this.code=code;} }
const fail=code=>{throw new StateError(code);};
export function text(value,max=2000){if(typeof value!=='string'||value.length>max)fail('invalid-text');return value.trim();}
function date(value){if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT/.test(value)||!Number.isFinite(Date.parse(value)))fail('invalid-date');return value;}
function id(value){const result=text(value,100);if(!result)fail('invalid-id');return result;}
export function metricValues(raw){
  if(!raw||typeof raw!=='object')fail('invalid-metrics');
  return Object.fromEntries(Object.entries(METRICS).map(([key,rule])=>{
    const value=raw[key];
    if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>rule.max||(rule.integer&&!Number.isInteger(value)))fail('invalid-'+key);
    return [key,value];
  }));
}
export function snapshotRecord(raw){
  if(!raw||typeof raw!=='object')fail('invalid-snapshot');
  const name=text(raw.name,120);if(!name)fail('source-required');
  return {id:id(raw.id),name,notes:text(raw.notes??''),updatedAt:date(raw.updatedAt),sourceType:'manual',status:'unverified',metrics:metricValues(raw.metrics)};
}
export const makeId=()=>globalThis.crypto.randomUUID();
export function createSnapshot(name,notes,metrics,now=new Date().toISOString()){
  return snapshotRecord({id:makeId(),name,notes,updatedAt:now,metrics});
}
export function calculateScenario(baseline,lever,change,prompt,now=new Date().toISOString()){
  if(!baseline)fail('baseline-required');
  const frozen=snapshotRecord(baseline),rule=LEVERS[lever],description=text(prompt,500);
  if(!description)fail('description-required');
  if(!rule||typeof change!=='number'||!Number.isFinite(change)||change < -95||change>100)fail('invalid-change');
  const factor=change/100,modeled={...frozen.metrics};
  modeled.gmv=Math.round(frozen.metrics.gmv*(1+factor*rule.elasticity)*100)/100;
  modeled[rule.metric]=frozen.metrics[rule.metric]*(1+factor);
  if(METRICS[rule.metric].integer)modeled[rule.metric]=Math.round(modeled[rule.metric]);
  else modeled[rule.metric]=Math.round(modeled[rule.metric]*10000)/10000;
  metricValues(modeled);
  return {id:makeId(),prompt:description,lever,change,createdAt:date(now),baseline:frozen,modeled,
    status:'simulated',modelVersion:'sensitivity-v1',assumptions:['其他经营条件不变','货源和履约能力不变'],elasticity:rule.elasticity};
}
export function scenarioRecord(raw){
  if(!raw||typeof raw!=='object')fail('invalid-scenario');
  const expected=calculateScenario(raw.baseline,raw.lever,raw.change,raw.prompt,raw.createdAt);
  const metrics=metricValues(raw.modeled);
  if(Object.keys(METRICS).some(k=>Math.abs(metrics[k]-expected.modeled[k])>1e-6))fail('invalid-scenario-result');
  return {...expected,id:id(raw.id)};
}
function reportRecord(raw){
  if(!raw||typeof raw!=='object')fail('invalid-report');
  const title=text(raw.title,120);if(!title)fail('title-required');
  const baseline=snapshotRecord(raw.baseline),scenario=raw.scenario?scenarioRecord(raw.scenario):null;
  if(scenario&&JSON.stringify(scenario.baseline)!==JSON.stringify(baseline))fail('report-baseline-mismatch');
  return {id:id(raw.id),title,createdAt:date(raw.createdAt),baseline,scenario,note:text(raw.note??'',4000)};
}
/** @param {string} title @param {ReturnType<typeof createSnapshot>|null} baseline @param {ReturnType<typeof calculateScenario>|null} [scenario] */
export function createReport(title,baseline,scenario=null){
  if(!baseline)fail('baseline-required');
  return reportRecord({id:makeId(),title,createdAt:new Date().toISOString(),baseline:scenario?.baseline??baseline,scenario,note:''});
}
export function emptyState(){return {schemaVersion:1,snapshot:null,scenarios:[],reports:[],drafts:[],selectedReportId:null};}
export function normalizeState(raw){
  if(!raw||raw.schemaVersion!==1)fail('invalid-state');
  for(const key of ['scenarios','reports','drafts'])if(!Array.isArray(raw[key])||raw[key].length>50)fail('invalid-history');
  const reports=raw.reports.map(reportRecord);
  const drafts=raw.drafts.map(d=>({id:id(d.id),title:text(d.title,120),body:text(d.body,4000),createdAt:date(d.createdAt),kind:['task','brief','plan','email'].includes(d.kind)?d.kind:'task'}));
  const selectedReportId=raw.selectedReportId===null?null:id(raw.selectedReportId);
  if(selectedReportId&&!reports.some(r=>r.id===selectedReportId))fail('invalid-report-selection');
  return {schemaVersion:1,snapshot:raw.snapshot?snapshotRecord(raw.snapshot):null,
    scenarios:raw.scenarios.map(scenarioRecord),reports,drafts,selectedReportId};
}
export function loadState(storage){
  try{const raw=storage.getItem(STORAGE_KEY);if(raw===null)return {state:emptyState(),error:null};if(raw.length>1000000)fail('oversized-state');return {state:normalizeState(JSON.parse(raw)),error:null};}
  catch{return {state:emptyState(),error:'read-failed'};}
}
export function saveState(storage,state){
  const normalized=normalizeState(state);
  try{storage.setItem(STORAGE_KEY,JSON.stringify(normalized));}catch{throw new StateError('save-failed');}
  return normalized;
}
export function parseMetricInput(value,key){
  if(typeof value!=='string'||value.trim()==='')fail('invalid-'+key);
  const n=Number(value),r=METRICS[key];
  if(!r||!Number.isFinite(n)||n<0||n>r.max||(r.integer&&!Number.isInteger(n)))fail('invalid-'+key);
  return n;
}
export function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
/** The only dynamic public-content adapter. Unknown audiences/types/visibility fail closed. */
export function publicText(artifact){
  if(!artifact||artifact.audience!=='user'||artifact.visibility!=='render'||!['product_copy','product_data','user_progress'].includes(artifact.semantic_type)||typeof artifact.text!=='string')return '';
  return escapeHtml(artifact.text);
}
export const userText=value=>publicText({audience:'user',visibility:'render',semantic_type:'product_data',text:String(value)});
export function formatMetric(key,value){
  if(value===null||value===undefined)return '—';
  if(key==='gmv'||key==='revenue')return '¥'+value.toLocaleString('zh-CN',{maximumFractionDigits:2});
  if(key==='conversion'||key==='repeat')return value.toFixed(2)+'%';
  return value.toLocaleString('zh-CN',{maximumFractionDigits:2});
}
/** Read-only portable report. It is an explicit user-approved copy, not live access control. */
export function shareReportToken(report){
  const data=JSON.stringify({version:1,report:reportRecord(report)});
  const bytes=new TextEncoder().encode(data);
  if(bytes.length>48000)fail('report-too-large');
  return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function readSharedReport(token){
  if(typeof token!=='string'||token.length>64000||!/^[A-Za-z0-9_-]+$/.test(token))fail('invalid-share');
  try{const b64=token.replace(/-/g,'+').replace(/_/g,'/');const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(payload.version!==1)fail('invalid-share');return reportRecord(payload.report);}catch{fail('invalid-share');}
}
