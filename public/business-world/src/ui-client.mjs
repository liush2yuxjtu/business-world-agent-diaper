import {emptyState,normalizeState,loadState,saveState,StateError} from './ui-state.mjs';

/** Translate UI edits into narrow commands; clients cannot replace server history. */
export function workspaceMutation(before,after){
  const next=normalizeState(after);
  if(next.snapshot?.id!==before.snapshot?.id){
    if(!next.snapshot)throw new StateError('invalid-command');
    const {name,notes,metrics}=next.snapshot;
    return {kind:'save-snapshot',name,notes,metrics};
  }
  const scenario=next.scenarios.find(x=>!before.scenarios.some(old=>old.id===x.id));
  if(scenario)return {kind:'run-scenario',lever:scenario.lever,change:scenario.change,prompt:scenario.prompt};
  const report=next.reports.find(x=>!before.reports.some(old=>old.id===x.id));
  if(report)return {kind:'create-report',title:report.title,scenarioId:report.scenario?.id??null};
  const note=next.reports.find(x=>before.reports.some(old=>old.id===x.id&&old.note!==x.note));
  if(note)return {kind:'save-note',reportId:note.id,note:note.note};
  const draft=next.drafts.find(x=>!before.drafts.some(old=>old.id===x.id));
  if(draft)return {kind:'save-draft',title:draft.title,body:draft.body,draftKind:draft.kind};
  if(next.selectedReportId!==before.selectedReportId)return {kind:'select-report',reportId:next.selectedReportId};
  throw new StateError('invalid-command');
}

/** Only the trusted same-origin application route can opt into shared persistence. */
export function createWorkspaceClient({storage,endpoint=null,fetcher=globalThis.fetch}){
  if(endpoint!==null&&endpoint!=='/api/business-world/workspace')throw new StateError('invalid-endpoint');
  let revision=0,workspaceId=null,ready=!endpoint;
  function accept(body){
    if(!body||!Number.isSafeInteger(body.revision)||body.revision<revision||typeof body.workspaceId!=='string'||!body.workspaceId||body.workspaceId.length>120)throw new StateError('invalid-response');
    if(workspaceId!==null&&workspaceId!==body.workspaceId)throw new StateError('invalid-response');
    const state=normalizeState(body.state);
    revision=body.revision;workspaceId=body.workspaceId;ready=true;
    return {state,error:null};
  }
  async function request(method,body){
    let response;
    try{response=await fetcher(endpoint,{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});}
    catch{throw new StateError('connection-unavailable');}
    if(!response.ok)throw new StateError(({401:'authentication-required',403:'permission-denied',409:'revision-conflict',413:'invalid-size'})[response.status]??'connection-unavailable');
    try{return accept(await response.json());}catch(error){if(error instanceof StateError)throw error;throw new StateError('invalid-response');}
  }
  return {
    shared:!!endpoint,
    get ready(){return ready;},
    get revision(){return revision;},
    get workspaceId(){return workspaceId;},
    async load(){return endpoint?request('GET'):loadState(storage);},
    async save(before,next){
      if(!endpoint)return {state:saveState(storage,next),error:null};
      if(!ready)throw new StateError('connection-unavailable');
      if(JSON.stringify(normalizeState(next))===JSON.stringify(normalizeState(before)))return {state:normalizeState(before),error:null};
      return request('POST',{expectedRevision:revision,command:workspaceMutation(before,next)});
    },
  };
}
