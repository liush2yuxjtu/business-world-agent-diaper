import {SCREENS,renderRecordSurface,syncWorkbench,draftSeed} from './ui-workbench.mjs';
import {createWorkspaceClient} from './ui-client.mjs';
import {renderDeep} from './ui-surfaces.mjs';
import {STORAGE_KEY,shareReportToken,readSharedReport,METRICS,LEVERS,emptyState,loadState,saveState,createSnapshot,calculateScenario,createReport,parseMetricInput,makeId,userText as h,formatMetric as fmt} from './ui-state.mjs';
import {reportHtml,downloadPresentation} from './ui-report.mjs';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const NAV=[['overview','总览'],['persona','Persona Studio'],['world','World Builder'],['content','内容策略'],['live','直播作战室'],['growth','投放优化'],['product','商品分析'],['experiment','模拟实验'],['report','报告']];
const KEY_NAMES={content:'engagement',live:'live',conversion:'conversion',ads:'roi',gmv:'gmv',revenue:'revenue',repeat:'repeat'};
const definitions={gmv:'统计周期内已支付订单的商品总金额。',conversion:'完成购买人数占访问人数的比例。',content:'统计周期内内容获得的互动次数。',live:'统计周期内直播获得的观看人次。',ads:'广告带来的收入与广告费用之比。',repeat:'统计周期内再次购买的用户占比。',revenue:'统计周期内录入的收入金额。',persona:'人群分组需要行为、订单等来源支持，不能从总量指标自动得到。'};
const forms={gmv:'editGmv',conversion:'editConversion',engagement:'editEngagement',roi:'editRoi',repeat:'editRepeat',live:'editLive',revenue:'editRevenue'};
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
const client=createWorkspaceClient({storage,endpoint:document.querySelector('meta[name=business-world-state]')?.content??null});
const place=client.shared?'当前工作区':'此设备';let writePending=false;
const loaded=(client.shared||location.hash.startsWith("#report="))?{state:emptyState(),error:null}:loadState(storage);let state=loaded.state,readError=loaded.error,view='overview',entity='gmv',scenarioPreset='baseline',lastRun=null,pending=false,zoom=1;
let toastTimer;
let flowContext=null;
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),5000);}
// A failed initial read is unknown data, not a confirmed empty workspace.
function workspaceReadPending(){return client.shared&&!client.ready;}
function workspaceReadMessage(){return readError?'暂时无法读取工作区记录，请恢复连接后刷新。':'正在读取工作区记录…';}
function requireWorkspaceRead(){if(!workspaceReadPending())return true;toast(workspaceReadMessage());return false;}
function errorMessage(error){
 const messages={'authentication-required':'请先登录，再读取或保存工作区记录。','permission-denied':'当前账户无法执行此操作。','revision-conflict':'记录已在其他页面或 Agent 中更新。请刷新后重新确认，未覆盖新记录。','connection-unavailable':'暂时无法连接工作区，未将更改保存为成功。请恢复连接后重试。','invalid-response':'工作区返回的记录无法读取。请刷新后重试。','save-pending':'正在保存上一项更改，请稍后重试。'};
 if(messages[error?.code])return messages[error.code];
  if(error?.code==='save-failed')return '无法保存到此设备。请检查浏览器存储空间或访问权限后重试。';
  if(error?.code==='baseline-required')return '请先添加经营记录，再运行情景或创建报告。';
  if(error?.code==='description-required')return '请填写情景描述。';
  if(error?.code==='source-required')return '请填写来源名称。';
  if(error?.code==='invalid-change')return '变化幅度必须是 -95 到 100 之间的数字。';
  if(error?.code?.startsWith('invalid-')){const r=METRICS[error.code.slice(8)];if(r)return `${r.label}必须在 0 到 ${r.max.toLocaleString('zh-CN')} 之间${r.integer?'，且为整数':''}。`;}
  return '内容无法保存，请检查必填项及数值范围后重试。';
}
async function commit(next){if(writePending)throw Object.assign(new Error(),{code:'save-pending'});writePending=true;try{const result=await client.save(state,next);state=result.state;readError=null;renderAll();}finally{writePending=false;}}
function table(headers,rows){return '<div class="table-scroll" tabindex="0" aria-label="数据表，可横向滚动"><table class="deep-table"><thead><tr>'+headers.map(x=>'<th scope="col">'+h(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';}
function tr(cells,attrs=''){return '<tr '+attrs+'>'+cells.map(c=>'<td>'+c+'</td>').join('')+'</tr>';}
function empty(message){return '<div class="empty-records">'+h(message)+'</div>';}
function openDetail(title,html){$('#detailTitle').textContent=title;$('#detailBody').innerHTML=html;if(!$('#detailModal').open)$('#detailModal').showModal();}
function showInfo(kind){
 const info={privacy:['数据与隐私','你录入的经营记录、报告和草稿仅保存在当前浏览器。此页面不会把记录上传到业务平台，也不会替你发送邮件或调整投放。请勿录入密码、密钥或个人敏感信息。清除浏览器数据会删除这些记录。'],help:['使用帮助','先添加经营记录，再查看各业务页、比较情景或创建报告。演示案例单独展示，不代表你的经营情况。情景结果只反映设定假设，不能当作销量预测。所有建议先保存为草稿，由你决定是否执行。'],share:['无法创建分享链接','记录仅保存在当前浏览器，无法生成可跨设备访问的只读链接。可以导出报告后分享给同事。'],login:['我的工作区','此工作区无需登录。你的记录保存在当前浏览器，不会自动同步到其他设备。']};
 if(client.shared){info.privacy=['数据与隐私','本工作区的经营记录、情景、报告和草稿保存在服务器上。登录同一账户的页面与 Agent 共用这些记录；人工录入仍然尚未核验。不会自动发布内容、发送邮件或调整投放。请勿录入密码或密钥。'];info.login=['我的工作区','当前账户的经营记录与 Agent 共用。刷新可读取最新记录。'];}
 const [title,body]=info[kind]??info.help;openDetail(title,'<p class="dialog-content">'+h(body)+'</p><button class="btn" data-close-dialog>关闭</button>');
}
function openSource(){if(!requireWorkspaceRead())return;const s=state.snapshot;$('#sourceName').value=s?.name??'';$('#sourceNotes').value=s?.notes??'';for(const [key,id] of Object.entries(forms))$('#'+id).value=s?.metrics[key]??'';$('#sourceError').textContent='';$('#sourceModal').showModal();$('#sourceName').focus();}
$('#sourceForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=$('#saveSource');button.disabled=true;button.textContent='保存中…';
 try{const metrics=Object.fromEntries(Object.entries(forms).map(([key,id])=>[key,parseMetricInput($('#'+id).value,key)]));const next=createSnapshot($('#sourceName').value,$('#sourceNotes').value,metrics);await commit({...state,snapshot:next});lastRun=null;renderWorld();renderExperimentResult();$('#sourceModal').close();toast('经营记录已保存到'+place+'。');}
 catch(error){$('#sourceError').textContent=errorMessage(error);}
 finally{button.disabled=false;button.textContent='保存记录';}
});
function renderSource(){
 const s=state.snapshot;
 $('#sourceBanner').innerHTML=s?'<strong>人工录入 · 尚未核验</strong><div class="source-meta"><span>来源：'+h(s.name)+'</span><span id="sourceTime">保存时间：'+h(new Date(s.updatedAt).toLocaleString('zh-CN',{hour12:false}))+'</span></div>':'<strong>尚无经营记录</strong><span>请先添加数据；演示案例不会作为你的经营结果。</span><button class="btn" data-open-source>添加经营记录</button>';
 if(client.shared&&!client.ready&&!readError)$('#sourceBanner').innerHTML='<strong>正在读取工作区记录…</strong>';
 if(readError)$('#sourceBanner').insertAdjacentHTML('beforeend','<p role="alert">'+h(client.shared?errorMessage({code:readError}):'无法读取已保存的记录。请检查浏览器设置后重试，或重新添加经营记录。')+'</p>');
 if(client.shared&&client.ready)$('#sourceBanner').insertAdjacentHTML('beforeend','<span>与当前账户的 Agent 共用记录</span>');
 $('#kpiRow').innerHTML=['gmv','conversion','engagement','roi','repeat'].map(key=>'<button class="kpi" data-metric="'+key+'" aria-label="查看'+h(METRICS[key].label)+'详情"><div class="label">'+h(METRICS[key].label)+'</div><div class="value" data-value="'+key+'">'+h(fmt(key,s?.metrics[key]))+'</div><div class="tiny muted">'+(s?'人工记录 · 尚未核验':'暂无记录')+'</div></button>').join('');
}
function renderInspector(key){
 entity=key;
 if(workspaceReadPending()){$('#inspector').innerHTML='<h3>实体详情</h3><p>'+h(workspaceReadMessage())+'</p>';$$('.node').forEach(n=>{n.classList.toggle('selected',n.dataset.entity===key);n.setAttribute('aria-pressed',String(n.dataset.entity===key));});return;}
 const metric=KEY_NAMES[key],s=state.snapshot,r=key==='gmv'?lastRun:null;
 const title=key==='persona'?'人群分组':METRICS[metric]?.label??'经营指标';
 const type=r?'情景估算':s&&metric?'人工记录 · 尚未核验':'暂无记录';
 const value=r?fmt('gmv',r.modeled.gmv):fmt(metric,s?.metrics[metric]);
 $('#inspector').innerHTML='<h3>实体详情</h3><div class="entity-title">'+h(title)+'</div><div class="entity-value">'+h(value)+'</div><div class="irow"><span>数据状态</span><b>'+h(type)+'</b></div><div class="irow"><span>来源</span><b>'+h(r?r.baseline.name:s?.name??'未添加')+'</b></div><div class="irow"><span>记录时间</span><b>'+h(r?r.baseline.updatedAt:s?.updatedAt??'—')+'</b></div><div class="idesc">'+h(definitions[key]??'')+'</div>'+(r?'<p class="simulation-meta">依据「'+h(r.prompt)+'」估算。其他经营条件及供货能力不变。结果不是实际销量或预测。</p>':'')+'<div class="iactions"><button data-factor="'+h(key)+'">查看相关因子</button><button data-simulate="'+h(key)+'">在新场景中模拟</button><button data-watch="'+h(key)+'">记录关注项</button><button data-history>查看历史情景</button></div>';
 $$('.node').forEach(n=>{n.classList.toggle('selected',n.dataset.entity===key);n.setAttribute('aria-pressed',String(n.dataset.entity===key));});
}
function renderWorld(){
 const s=state.snapshot;
 $$('.node').forEach(node=>{const key=KEY_NAMES[node.dataset.entity],r=node.dataset.entity==='gmv'?lastRun:null;node.querySelector('b').textContent=r?fmt('gmv',r.modeled.gmv):fmt(key,s?.metrics[key]);node.querySelector('.ntype').textContent=r?'情景估算':s&&key?'人工记录':'暂无记录';node.classList.toggle('unavailable',!s||!key);});
 $('#evidenceCount').textContent=s?'1':'0';
 $('#evidenceBody').innerHTML=s?tr([h(new Date(s.updatedAt).toLocaleString('zh-CN')),h(s.name),'人工录入 · 尚未核验',h(s.notes||'未填写备注')],'data-source-evidence role="button" tabindex="0" aria-label="查看来源记录"'):tr(['—','暂无来源记录','请先添加经营记录','—']);
 const rows=state.scenarios.map(r=>tr([h(new Date(r.createdAt).toLocaleTimeString('zh-CN')),h(r.prompt),h(LEVERS[r.lever].label+' '+r.change+'%'),h(fmt('gmv',r.modeled.gmv))],'data-run-id="'+h(r.id)+'" role="button" tabindex="0" aria-label="查看情景 '+h(r.prompt)+'"'));
 $('#scenarioBody').innerHTML=rows.join('')||tr(['—','暂无情景记录','请先运行情景','—']);$('#scenarioCount').textContent=String(state.scenarios.length);
 renderInspector(entity);$('#runSim').disabled=pending;
}
const summaries={overview:['gmv','conversion','roi','repeat'],persona:[],content:['engagement'],live:['live'],growth:['roi'],product:['gmv','conversion','repeat']};
function renderBusinessPages(){
 for(const id of Object.keys(summaries)){
  const record=$('#view-'+id).querySelector('.page-records');
  record.innerHTML=renderRecordSurface(id,state,{unknown:workspaceReadPending(),place});
 }
 renderDrafts();
}

function renderDrafts(){
 $$('.saved-drafts').forEach(el=>{el.innerHTML='<h3>已保存的行动草稿</h3>'+(state.drafts.length?table(['名称','类型','保存时间'],state.drafts.map(d=>tr([h(d.title),h({task:'任务',brief:'内容提纲',plan:'发布计划',email:'邮件草稿'}[d.kind]),h(new Date(d.createdAt).toLocaleString('zh-CN'))],'data-draft-id="'+h(d.id)+'" role="button" tabindex="0"'))):empty('暂无行动草稿。草稿不会自动发布或发送。'));});
}
function inspectSource(){if(workspaceReadPending()){openDetail('来源记录','<p>'+h(workspaceReadMessage())+'</p><button class="btn" data-close-dialog>关闭</button>');return;}const s=state.snapshot;openDetail('来源记录',s?'<p>人工录入 · 尚未核验</p><h3>'+h(s.name)+'</h3><p>保存时间：'+h(s.updatedAt)+'</p><p class="dialog-content">'+h(s.notes||'未填写备注')+'</p>'+table(['指标','记录'],Object.keys(METRICS).map(k=>tr([h(METRICS[k].label),h(fmt(k,s.metrics[k]))]))):empty('尚未添加经营记录。'));}
function openDraft(kind='task',title='',body=''){
 if(!requireWorkspaceRead())return;
 const labels={task:'任务草稿',brief:'内容提纲',plan:'发布计划',email:'邮件草稿'};
 openDetail(labels[kind]??labels.task,'<p>保存到'+place+'，不会发布内容、调整预算或发送邮件。</p><form id="draftForm" data-kind="'+h(kind)+'"><div class="field"><label for="draftTitle">名称</label><input id="draftTitle" maxlength="120" required value="'+h(title)+'"></div><div class="field"><label for="draftBody">内容</label><textarea id="draftBody" maxlength="4000" required>'+h(body)+'</textarea></div><p class="form-error" id="draftError" role="alert"></p><div class="modal-actions"><button class="btn" type="button" data-close-dialog>取消</button><button class="btn primary" type="submit">确认保存草稿</button></div></form>');$('#draftTitle').focus();
}
function selectPersona(card){
 $$('.persona-card').forEach(c=>{c.classList.toggle('selected',c===card);c.setAttribute('aria-pressed',String(c===card));});
 const title=card.querySelector('.persona-title').textContent;
 const inspector=$('#view-persona .example-catalog .grid-3').children[2];
 inspector.innerHTML='<h3>人群详情：'+h(title)+'</h3><p class="example-notice">演示案例，不代表你的用户画像。</p><div class="dialog-content">'+h(card.innerText)+'</div><p>案例来源：产品演示材料。真实分群需要行为与订单证据，当前没有可核验的人群规模或置信度。</p><div class="toolbar"><button class="btn" data-example-evidence>查看证据说明</button><button class="btn" data-persona-task="'+h(title)+'">创建任务</button></div>';
}
function showFlowContext(context,origin=null,persist=true){
 $$('.flow-context').forEach(el=>el.remove());
 if(!context){flowContext=null;return;}
 flowContext={text:String(context).slice(0,500),origin:SCREENS[origin]?origin:null,view};
 const note=document.createElement('div');note.className='flow-context';note.setAttribute('role','status');
 note.innerHTML='<span>'+h('当前查看：'+flowContext.text)+'</span>'+(flowContext.origin?'<button class="btn" data-view="'+flowContext.origin+'">返回'+h(SCREENS[flowContext.origin].label)+'</button>':'')+'<button class="btn" data-clear-context>清除背景</button>';
 $('#view-'+view).prepend(note);
 if(persist)history.replaceState({...history.state,bwaFlow:flowContext},'',location.href);
}

function inspectExample(target){
 const origin=target.closest('.view')?.id.replace('view-','')??view;
 const card=target.closest('.card,.command-card');
 const title=target.querySelector('h3,b,.persona-title')?.textContent??card?.querySelector('h3')?.textContent??target.textContent.trim().slice(0,60);
 const context=title+' · '+target.innerText.trim().replace(/\s+/g,' ').slice(0,100);
 const routes=({overview:['growth','product','content','live'],persona:['content','world'],content:['persona','product'],live:['persona','product','world'],growth:['persona','product','experiment'],product:['persona','content','growth']})[origin]??['world'];
 let evidence='此案例未关联你的业务凭证。来源为演示材料，不作为实际经营依据。';
 if(target.matches('.fstep')){const stages=[...target.parentElement.children],i=stages.indexOf(target),current=Number(target.querySelector('b').textContent.replaceAll(',','')),previous=i?Number(stages[i-1].querySelector('b').textContent.replaceAll(',','')):0;if(previous)evidence+=' 案例漏斗：从上一步 '+previous.toLocaleString('zh-CN')+' 到 '+current.toLocaleString('zh-CN')+'，流失 '+(previous-current).toLocaleString('zh-CN')+'，阶段留存 '+(current/previous*100).toFixed(1)+'%。';}
 openDetail(title,'<p class="example-notice">演示案例，不代表你的经营记录，也不作为决策依据。</p><div class="dialog-content">'+h(target.innerText)+'</div><p>'+h(evidence)+'</p><div class="toolbar"><button class="btn" data-source-evidence>查看我的来源</button><button class="btn" data-example-draft>整理为行动草稿</button>'+routes.map(id=>'<button class="btn" data-view="'+id+'" data-context="'+h(context)+'">前往'+h(NAV.find(n=>n[0]===id)[1])+'</button>').join('')+'</div>');
}
function setupExamples(){
 for(const id of Object.keys(summaries)){
  renderDeep(id);const el=$('#view-'+id),content=el.innerHTML;
  el.innerHTML='<div class="deep-page"><section class="page-records"></section><details class="example-catalog"><summary>浏览'+h(NAV.find(n=>n[0]===id)[1])+'演示案例</summary><p class="example-notice">以下均为演示案例：人数、金额、趋势和建议不代表你的经营数据，不能当作已核验事实。</p>'+content+'</details><section class="card saved-drafts"></section></div>';
 }
 $$('.example-catalog table').forEach(t=>{const w=document.createElement('div');w.className='table-scroll';w.tabIndex=0;w.setAttribute('aria-label','演示数据表，可横向滚动');t.before(w);w.append(t);});
 $$('.example-catalog th').forEach(th=>th.scope='col');
 $$('.example-catalog a:not([href]), .example-catalog .selectish').forEach(el=>{const b=document.createElement('button');b.className='action-link';b.textContent=el.textContent;b.dataset.exampleDetail='';el.replaceWith(b);});
 $$('.example-catalog tbody tr, .example-catalog .bubble, .example-catalog .day, .example-catalog .fstep, .example-catalog .alert-row, .example-catalog .list-row, .example-catalog .signal-row, .example-catalog .bar-group, .example-catalog .legend-list span').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.dataset.exampleDetail='';el.setAttribute('aria-label','查看案例：'+el.textContent.replace(/\s+/g,' ').slice(0,70));});
 $$('.persona-card').forEach((card,index)=>{card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-pressed',String(index===0));card.dataset.personaKind=['observed','observed','inferred','template'][index];card.querySelector('.chip').textContent={observed:'观测类示例',inferred:'推断类示例',template:'策略模板'}[card.dataset.personaKind];});
 const tabs=$$('#view-persona .seg button');tabs.forEach((b,i)=>{b.dataset.personaFilter=['observed','inferred','template'][i];b.setAttribute('role','tab');b.setAttribute('aria-selected','false');b.classList.remove('active');});tabs[0].parentElement.setAttribute('role','tablist');tabs[0].parentElement.setAttribute('aria-label','人群案例类型');
 // Initially show all four examples; selecting a category applies a real filter.
 const template=Array.from(document.querySelectorAll('.persona-card')).find(c=>c.dataset.personaKind==='template');if(template){template.querySelectorAll('.persona-stats strong').forEach(e=>e.textContent='待研究');const small=template.querySelector('.tiny');if(small)small.textContent='策略模板 · 待收集证据';template.querySelectorAll('*').forEach(el=>{if(el.textContent.trim().startsWith('购买频次'))el.textContent='购买频次：待收集证据';});}
 const all=document.createElement('button');all.textContent='全部';all.dataset.personaFilter='all';all.setAttribute('role','tab');all.setAttribute('aria-selected','true');all.className='active';tabs[0].before(all);
 $$('.example-catalog .seg:not([role=tablist])').forEach(seg=>{seg.setAttribute('role','group');seg.querySelectorAll('button').forEach(b=>b.dataset.exampleTab='');});
 $$('#view-product .bar-group').forEach((b,i)=>b.dataset.productCategory=['拉拉裤','纸尿裤','湿巾','夜用款'][i]);
 $$('#view-growth .budget-wrap .legend-list span').forEach((b,i)=>b.dataset.channel=['千川','信息流','搜索','再营销'][i]);
 $$('#view-product .deep-table').forEach((t,i)=>{if(i===0)t.querySelectorAll('tbody tr').forEach(r=>r.dataset.productRow='');});
 $$('#view-overview .example-catalog .grid-4')[1]?.querySelectorAll('.card').forEach((c,i)=>{c.dataset.view=['content','live','product','growth'][i];c.tabIndex=0;c.setAttribute('role','button');});
 $$('.example-catalog .metric').forEach(c=>{c.dataset.exampleDetail='';c.tabIndex=0;c.setAttribute('role','button');});
 $$('#view-product .irow').filter(el=>el.textContent.includes('核心人群')).forEach(el=>{el.dataset.view='persona';el.dataset.context='商品关联人群：'+el.textContent;el.tabIndex=0;el.setAttribute('role','button');});
 $$('#view-live .legend-list span').forEach(b=>{b.dataset.view='persona';b.dataset.context='直播观众：'+b.textContent;});
 $$('.bar-chart').forEach(el=>{el.tabIndex=0;el.setAttribute('aria-label','案例柱状图，可横向滚动');}); const budget=$('#view-growth .budget-donut');budget.setAttribute('aria-label','预算分配图。点击扇区筛选，下方渠道按钮支持键盘操作。');budget.addEventListener('click',event=>{const rect=budget.getBoundingClientRect(),x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2,fraction=(Math.atan2(x,-y)/(2*Math.PI)+1)%1;const i=fraction<.402?0:fraction<.727?1:fraction<.91?2:3;$$('#view-growth [data-channel]')[i].click();});

 selectPersona($('.persona-card'));
 // The existing examples stay deep, but cannot be mistaken for live records.
}
function setupExperiment(){
 $('#view-experiment').innerHTML='<div class="deep-page"><div class="deep-header"><div><h2>模拟实验</h2><p class="muted">比较经营假设，不改变原始记录。</p></div><div class="toolbar"><button class="btn" data-scenario-report>发送到报告</button><button class="btn" data-view="world">在 World Builder 中查看</button></div></div><form class="card" id="experimentForm" novalidate><h3>情景设置</h3><div class="editor-grid"><div class="field span-2"><label for="expPrompt">情景描述</label><input id="expPrompt" maxlength="500" required placeholder="例如：提高广告效率，比较经营结果"></div><div class="field"><label for="expLever">经营杠杆</label><select id="expLever">'+Object.entries(LEVERS).map(([k,v])=>'<option value="'+k+'">'+h(v.label)+'</option>').join('')+'</select></div><div class="field"><label for="expChange">变化幅度（-95% 至 100%）</label><input id="expChange" type="number" min="-95" max="100" step="any" value="20" required></div></div><p>假设：其他经营条件、货源和履约能力不变。</p><p>GMV 按所选杠杆的灵敏度估算；灵敏度是可检查的假设，不是训练得到的预测。</p><p id="expError" class="form-error" role="alert"></p><div class="toolbar"><button id="expRun" type="submit" class="btn primary">运行实验</button><button type="button" class="btn" data-open-source>查看 / 添加基准记录</button></div></form><section class="card" id="expResult" aria-live="polite"></section><section class="card"><h3>已保存的情景</h3><div id="experimentHistory"></div></section></div>';
}
function renderExperimentResult(){
 const r=lastRun;
 $('#expResult').innerHTML=pending?'<h3>正在计算…</h3><p>计算完成后会保存情景记录。</p>':!r?empty(state.scenarios.length?'从已保存的记录中选择一个情景，或填写新的假设开始比较。':state.snapshot?'尚未运行情景。填写描述、选择杠杆后开始比较。':'尚无基准记录，暂时不能运行情景。'): '<h3>情景估算：'+h(r.prompt)+'</h3><p class="simulation-meta">情景估算不是实际经营结果，也不是销量预测。</p>'+table(['指标','基准记录','情景估算'],Object.keys(METRICS).map(k=>tr([h(METRICS[k].label),h(fmt(k,r.baseline.metrics[k])),h(fmt(k,r.modeled[k]))])))+'<p>基准来源：'+h(r.baseline.name)+' · '+h(r.baseline.updatedAt)+'</p><p>假设：'+h(r.assumptions.join('；'))+'。GMV ×（1 + '+h(r.change)+'% × '+h(r.elasticity)+'）。未校准的灵敏度不代表置信度。</p><div class="toolbar"><button class="btn" data-scenario-report>将此情景整理为报告</button></div>';
 $('#experimentHistory').innerHTML=state.scenarios.length?table(['情景','杠杆','变化幅度','估算 GMV'],state.scenarios.map(r=>tr([h(r.prompt),h(LEVERS[r.lever].label),h(r.change+'%'),h(fmt('gmv',r.modeled.gmv))],'data-run-id="'+h(r.id)+'" role="button" tabindex="0"'))):empty('暂无情景记录。');
 $('#expRun').disabled=pending;$('#expRun').textContent=pending?'计算中…':'运行实验';$('#runSim').disabled=pending;$('#runSim').textContent=pending?'计算中…':'运行模拟';
}
async function runScenario(lever,change,prompt){
 if(pending||!requireWorkspaceRead())return;
 let run;
 try{run=calculateScenario(state.snapshot,lever,change,prompt);}catch(error){$('#expError').textContent=errorMessage(error);toast(errorMessage(error));return;}
 pending=true;$('#expError').textContent='';renderExperimentResult();
 try{
  await new Promise(resolve=>setTimeout(resolve,350));
  // Calculate from a captured baseline; later source edits cannot rewrite the run.
  await commit({...state,scenarios:[run,...state.scenarios].slice(0,50)});lastRun=state.scenarios[0];renderWorld();toast('情景已计算并保存到'+place+'。');
 }catch(error){$('#expError').textContent=errorMessage(error);toast(errorMessage(error));}
 finally{pending=false;renderExperimentResult();}
}
function selectedReport(){return state.reports.find(r=>r.id===state.selectedReportId)??null;}
function openReportComposer(scenario=null){
 if(!requireWorkspaceRead())return;
 if(!state.snapshot&&!scenario){toast('请先添加经营记录，再创建报告。');openSource();return;}
 openDetail('新建报告','<p>报告将固定当前选定的基准与情景，不会随之后的记录修改而改变。</p><form id="reportForm" data-scenario="'+h(scenario?.id??'')+'"><div class="field"><label for="reportTitle">报告名称</label><input id="reportTitle" required maxlength="120" value="经营分析报告"></div><p id="reportError" class="form-error" role="alert"></p><div class="modal-actions"><button class="btn" type="button" data-close-dialog>取消</button><button class="btn primary" type="submit">创建报告</button></div></form>');
}
function renderReports(){
 const r=selectedReport();
 $('#view-report').innerHTML='<div class="deep-page"><div class="deep-header"><div><h2>报告中心</h2><p class="muted">整理经营记录与情景假设，再由你决定如何分享。</p></div><button class="btn primary" data-new-report>新建报告</button></div><section class="card"><h3>已保存的报告（'+state.reports.length+'）</h3>'+(state.reports.length?table(['报告名称','保存时间','内容'],state.reports.map(x=>tr([h(x.title),h(new Date(x.createdAt).toLocaleString('zh-CN')),x.scenario?'经营记录与情景估算':'经营记录'],'data-report-id="'+h(x.id)+'" role="button" tabindex="0" aria-selected="'+String(x.id===r?.id)+'"'))):empty('暂无报告。先添加经营记录，再创建报告。'))+'</section><section class="card" id="selectedReport">'+(r?'<h2>'+h(r.title)+'</h2><p>人工录入 · 尚未核验</p><p>来源：'+h(r.baseline.name)+' · '+h(r.baseline.updatedAt)+'</p>'+table(['指标','基准记录',...(r.scenario?['情景估算']:[])],['gmv','conversion','engagement','roi','repeat','live','revenue'].map(k=>tr([h(METRICS[k].label),h(fmt(k,r.baseline.metrics[k])),...(r.scenario?[h(fmt(k,r.scenario.modeled[k]))]:[])])))+(r.scenario?'<p class="simulation-meta">'+h(r.scenario.prompt)+'；'+h(LEVERS[r.scenario.lever].label)+' '+h(r.scenario.change)+'%。'+h(r.scenario.assumptions.join('；'))+'。情景估算不是实际经营结果。</p>':'')+'<div class="toolbar"><button class="btn" id="downloadReport">打印 / 保存 PDF</button><button class="btn" id="downloadPpt">导出 PPT</button><button class="btn" data-info="share">分享链接</button><button class="btn" data-email-report>准备邮件</button><button class="btn" data-report-evidence>查看报告证据</button></div><h3>人工备注</h3><form id="noteForm"><label for="reportNote">单独保存的人工意见</label><textarea class="report-notes" id="reportNote" maxlength="4000">'+h(r.note)+'</textarea><p id="noteError" role="alert" class="form-error"></p><button class="btn primary" type="submit">保存备注</button></form>':empty('选择或创建报告后，在这里查看正文和导出。'))+'</section><section class="card"><h3>相关业务</h3><div class="toolbar">'+['overview','content','live','growth','product','experiment'].map(id=>'<button class="btn" data-view="'+id+'">'+h(NAV.find(n=>n[0]===id)[1])+'</button>').join('')+'</div></section></div>';
}
function renderAll(){
 renderSource();renderBusinessPages();renderWorld();renderExperimentResult();renderReports();
 syncWorkbench(view);
 if(flowContext?.view===view)showFlowContext(flowContext.text,flowContext.origin,false);
 if(workspaceReadPending()){
  const message=workspaceReadMessage();
  $('#sourceBanner').innerHTML='<strong>'+h(message)+'</strong>'+(readError?'<p role="alert">'+h(errorMessage({code:readError}))+'</p>':'');
  document.querySelectorAll('#kpiRow .tiny,.node .ntype,.view .empty-records').forEach(el=>el.textContent=message);
  $('#evidenceCount').textContent='—';$('#scenarioCount').textContent='—';
  $('#evidenceBody').innerHTML=tr(['—',message,'—','—']);$('#scenarioBody').innerHTML=tr(['—',message,'—','—']);
  $('#inspector').innerHTML='<h3>实体详情</h3><p>'+h(message)+'</p>';
  $('#view-report .card h3').textContent='已保存的报告';
 }
}
function setMode(mode){$('#landing').classList.toggle('hidden',mode!=='landing');$('#app').classList.toggle('hidden',mode!=='app');$('#landingMode').classList.toggle('active',mode==='landing');$('#appMode').classList.toggle('active',mode==='app');$('#fakeUrl').textContent=mode==='landing'?'Business World Agent':'经营工作台 / '+NAV.find(x=>x[0]===view)[1];}
function setView(id,route=true){
 if(!NAV.some(x=>x[0]===id))id='overview';view=id;
 $$('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+id));
 $$('#appNav [data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===id);if(b.dataset.view===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 setMode('app');$('#searchResults').classList.add('hidden');$('#searchInput').setAttribute('aria-expanded','false');$('.workspace').scrollTop=0;
 if(route&&location.hash!=='#app/'+id){history.pushState({},'','#app/'+id);flowContext=null;$$('.flow-context').forEach(el=>el.remove());}
 syncWorkbench(id);
}
function renderSearch(){
 const q=$('#searchInput').value.trim().toLowerCase(),r=$('#searchResults');
 if(!q){r.classList.add('hidden');$('#searchInput').setAttribute('aria-expanded','false');return;}
 const items=[...NAV.map(([key,label])=>({label,view:key})),...Object.entries(METRICS).map(([key,m])=>({label:m.label,metric:key})),...(state.snapshot?[{label:'来源：'+state.snapshot.name,source:true}]:[]),...state.scenarios.map(s=>({label:'情景：'+s.prompt,run:s.id}))].filter(x=>x.label.toLowerCase().includes(q)||x.view?.includes(q));
 r.innerHTML=items.length?items.map(x=>'<button '+(x.view?'data-view="'+x.view+'"':x.metric?'data-metric="'+x.metric+'"':x.source?'data-source-evidence':'data-run-id="'+h(x.run)+'"')+'>'+h(x.label)+'</button>').join(''):'<p>没有找到匹配项，请更换关键词。</p>';r.classList.remove('hidden');$('#searchInput').setAttribute('aria-expanded','true');
}
function filterPersona(kind){
 $$('#view-persona [data-persona-filter]').forEach(b=>{b.classList.toggle('active',b.dataset.personaFilter===kind);b.setAttribute('aria-selected',String(b.dataset.personaFilter===kind));});
 $$('.persona-card').forEach(c=>c.hidden=kind!=='all'&&c.dataset.personaKind!==kind);
 const first=$$('.persona-card').find(c=>!c.hidden);if(first)selectPersona(first);
}
function filterSamples(target){
 const isProduct=!!target.dataset.productCategory,root=target.closest('.example-catalog');
 const t=isProduct?root.querySelector('.deep-table'):root.querySelector('.budget-wrap').nextElementSibling.querySelector('.deep-table');
 const value=target.dataset.productCategory??target.dataset.channel;
 [...t.tBodies[0].rows].forEach(row=>row.hidden=!row.innerText.includes(value));
 let note=root.querySelector('.filter-note');if(!note){note=document.createElement('p');note.className='filter-note';t.closest('.table-scroll').before(note);}
 note.innerHTML='已筛选：'+h(value)+' <button class="btn" data-clear-filter>显示全部</button>';
}
function openEmail(){
 const r=selectedReport();if(!r)return;
 openDetail('准备报告邮件','<p>填写明确收件人后保存邮件草稿。本页不会发送邮件；请在你的邮件应用中附上已导出的报告并确认发送。</p><form id="emailForm"><div class="field"><label for="emailTo">收件人邮箱</label><input id="emailTo" type="email" multiple required placeholder="name@example.com"></div><div class="field"><label for="emailBody">邮件正文</label><textarea id="emailBody" maxlength="3000">'+h('请查阅报告：'+r.title+'。记录为人工录入，尚未核验。')+'</textarea></div><p id="emailError" role="alert" class="form-error"></p><button class="btn primary" type="submit">确认保存邮件草稿</button></form>');
}
function copyDraftFromDetail(){const title=$('#detailTitle').textContent;const body=$('#detailBody .dialog-content')?.textContent??title;openDraft('task',title.slice(0,120),body.slice(0,4000));}
document.addEventListener('click',async event=>{
 if(!$('#app'))return;
 const target=event.target.closest('button,a,[role=button]');if(!target)return;
 if(target.matches('[data-close-dialog]')){target.closest('dialog').close();return;}
 if(target.id==='landingMode'){history.replaceState(null,'','#landing');setMode('landing');return;}
 if(target.id==='appMode'||target.matches('[data-open-app]')){setView(view);return;}
 if(target.matches('[data-clear-context]')){showFlowContext(null);history.replaceState({...history.state,bwaFlow:null},'',location.href);return;}
 if(target.matches('[data-handoff]')){const origin=target.dataset.origin||view;const context=(flowContext?.text?flowContext.text+' → ':'')+SCREENS[origin].label+' · '+(state.snapshot?'来源：'+state.snapshot.name:'经营记录尚待添加');if($('#detailModal').open)$('#detailModal').close();setView(target.dataset.handoff);showFlowContext(context,origin);return;}
 if(target.matches('[data-work-draft]')){const origin=target.dataset.origin||view;const seed=draftSeed(origin,target.dataset.workDraft,target.dataset.draftPurpose,flowContext?.text);openDraft(target.dataset.workDraft,seed.title,seed.body);return;}
 if(target.matches('[data-open-examples]')){const id=target.dataset.openExamples;setView(id);const catalogue=$('#view-'+id+' .example-catalog');if(catalogue){catalogue.open=true;catalogue.scrollIntoView({block:'start'});catalogue.querySelector('summary')?.focus();}return;}
 if(target.matches('[data-view]')){const context=target.dataset.context;if($('#detailModal').open)$('#detailModal').close();setView(target.dataset.view);if(context)showFlowContext(context);return;}
 if(target.id==='sourceBtn'||target.matches('[data-open-source]')){openSource();return;}
 if(target.matches('[data-info]')){if(target.dataset.info==='share')openShare();else showInfo(target.dataset.info);return;}
 if(target.id==='refreshBtn'){target.disabled=true;try{const next=await client.load();state=next.state;readError=next.error;lastRun=lastRun?state.scenarios.find(r=>r.id===lastRun.id)??null:null;renderAll();toast(next.error?'无法读取记录，请检查浏览器设置后重试。':'已重新读取'+place+'记录；来源时间未改变。');}catch(error){readError=error.code??'connection-unavailable';renderAll();toast(errorMessage(error));}finally{target.disabled=false;}return;}
 if(target.matches('[data-metric]')){setView('world');renderInspector(Object.keys(KEY_NAMES).find(k=>KEY_NAMES[k]===target.dataset.metric)??'gmv');return;}
 if(target.matches('.node')){renderInspector(target.dataset.entity);return;}
 if(target.matches('[data-factor]')){const related=({gmv:['conversion','ads','repeat','content'],conversion:['persona','content','live'],ads:['content','gmv'],content:['persona','conversion'],repeat:['persona','gmv']})[target.dataset.factor]??['gmv'];$$('.node').forEach(n=>n.classList.toggle('related',related.includes(n.dataset.entity)));openDetail('相关因子','<p>'+h(definitions[target.dataset.factor])+'</p><p>相关因子已在图中用虚线框标出。</p><p>关系线表示可探索的关联，不表示已经验证的因果关系。</p><button class="btn" data-close-dialog>返回</button>');return;}
 if(target.matches('[data-simulate]')){const origin=view;const key=target.dataset.simulate;$('#expLever').value=({ads:'ad_efficiency',conversion:'checkout_conversion',content:'content_engagement',repeat:'repeat_purchase'})[key]??'ad_efficiency';$('#expPrompt').value='比较'+(METRICS[KEY_NAMES[key]]?.label??'经营指标')+'相关情景';setView('experiment');showFlowContext(SCREENS[origin].label+' · 已带入经营杠杆，尚未运行。',origin);return;}
 if(target.matches('[data-watch]')){openDraft('task','关注'+(METRICS[KEY_NAMES[target.dataset.watch]]?.label??'经营指标'),'请检查最新经营记录，并决定是否需要行动。');return;}
 if(target.matches('[data-history]')){setView('experiment');$('#experimentHistory').scrollIntoView({block:'center'});return;}
 if(target.matches('[data-source-evidence]')){inspectSource();return;}
 if(target.matches('[data-scenario]')){scenarioPreset=target.dataset.scenario;$$('#scenarioSeg button').forEach(b=>{b.classList.toggle('active',b===target);b.setAttribute('aria-pressed',String(b===target));});toast('已选择情景设置，请运行模拟查看结果。');return;}
 if(target.id==='runSim'){await runScenario('ad_efficiency',scenarioPreset==='growth'?20:scenarioPreset==='downside'?-30:0,scenarioPreset==='growth'?'增长计划':scenarioPreset==='downside'?'下行风险':'基准情景');return;}
 if(target.matches('[data-run-id]')){lastRun=state.scenarios.find(r=>r.id===target.dataset.runId)??null;renderWorld();renderExperimentResult();setView('experiment');return;}
 if(target.matches('[data-scenario-report]')){if(!lastRun){toast('请先运行或选择一个情景。');setView('experiment');return;}openReportComposer(lastRun);return;}
 if(target.matches('[data-new-report]')){openReportComposer();return;}
 if(target.matches('[data-report-id]')){try{await commit({...state,selectedReportId:target.dataset.reportId});}catch(error){toast(errorMessage(error));}return;}
 if(target.matches('[data-report-evidence]')){const r=selectedReport();if(r)openDetail('报告证据','<h3>'+h(r.baseline.name)+'</h3><p>人工录入 · 尚未核验</p><p>'+h(r.baseline.updatedAt)+'</p><p class="dialog-content">'+h(r.baseline.notes||'未填写备注')+'</p>'+(r.scenario?'<p>情景假设：'+h(r.scenario.assumptions.join('；'))+'</p>':''));return;}
 if(target.id==='downloadReport'){const r=selectedReport();if(!r)return;const popup=window.open('about:blank','_blank');if(!popup){toast('无法打开报告。请允许此站点打开新窗口后重试。');return;}popup.opener=null;popup.document.open();popup.document.write(reportHtml(r));popup.document.close();popup.document.getElementById('printReport').onclick=()=>popup.print();return;}
 if(target.id==='downloadPpt'){const r=selectedReport();if(!r)return;target.disabled=true;target.textContent='正在导出…';try{await downloadPresentation(r);toast('PPT 文件已导出。');}catch{toast('暂时无法导出 PPT，请重试或使用 PDF。');}finally{target.disabled=false;target.textContent='导出 PPT';}return;}
 if(target.matches('[data-email-report]')){openEmail();return;}
 if(target.matches('[data-persona-filter]')){filterPersona(target.dataset.personaFilter);return;}
 if(target.matches('.persona-card')){selectPersona(target);return;}
 if(target.matches('[data-persona-task]')){openDraft('task','研究'+target.dataset.personaTask,'先核对人群证据，再决定行动。');return;}
 if(target.matches('[data-example-evidence]')){openDetail('人群证据说明','<p>当前为演示人群，尚无真实行为与订单证据，不提供核验置信度。</p>');return;}
 if(target.matches('[data-product-category],[data-channel]')){filterSamples(target);return;}
 if(target.matches('[data-clear-filter]')){target.closest('.example-catalog').querySelectorAll('tr[hidden]').forEach(r=>r.hidden=false);target.parentElement.remove();return;}
 if(target.matches('[data-product-row]')){const cells=[...target.cells].map(c=>c.textContent),panel=$('#view-product .example-catalog .grid-3').children[1];panel.innerHTML='<h3>商品详情</h3><p class="example-notice">演示商品，不代表实际库存和销量。</p><h3>'+h(cells[2])+'</h3><p>'+h(cells[1])+'</p>'+table(['项目','案例值'],['销售额','转化率','客单价','库存周转','退款率','利润率'].map((x,i)=>tr([h(x),h(cells[i+3])])));return;}
 if(target.matches('[data-example-tab]')){target.parentElement.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===target);b.setAttribute('aria-pressed',String(b===target));});inspectExample(target.closest('.card'));return;}
 if(target.matches('[data-draft-id]')){const d=state.drafts.find(d=>d.id===target.dataset.draftId);if(d)openDetail(d.title,'<p>已保存到'+place+' · 尚未对外执行</p><p class="dialog-content">'+h(d.body)+'</p>'+(d.kind==='brief'?'<button class="btn primary" data-plan-from-draft="'+h(d.id)+'">加入发布计划</button>':''));return;}
 if(target.matches('[data-plan-from-draft]')){const d=state.drafts.find(d=>d.id===target.dataset.planFromDraft);if(d)openDraft('plan',d.title,d.body+'\n发布时间：待安排\n发布渠道：待确认');return;}
 if(target.matches('[data-new-draft]')){openDraft(target.dataset.newDraft);return;}
 if(target.matches('[data-example-draft]')){copyDraftFromDetail();return;}
 if(target.matches('[data-zoom]')){zoom=Math.max(.65,Math.min(1.5,zoom+Number(target.dataset.zoom)));$('#graph').style.zoom=zoom;$('#zoomValue').textContent=Math.round(zoom*100)+'%';return;}
 if(target.closest('.example-catalog')){
  const label=target.textContent.trim();
  if(label.includes('新建实验')){$('#expPrompt').value='比较投放优化假设';$('#expLever').value='ad_efficiency';setView('experiment');showFlowContext('来自投放优化的实验草稿；尚未运行。');return;}
  if(/生成 brief|新建主题|加入计划|创建任务|去执行|执行方案/.test(label)){openDraft(/brief|主题/.test(label)?'brief':/计划/.test(label)?'plan':'task',label.replace(/^[+✦]\s*/,''),'请根据自己的经营记录补充目标、证据和执行安排。');return;}
  inspectExample(target.closest('[data-example-detail]')??target);return;
 }
 if(target.matches('.marketing button,.marketing a:not([href])'))showInfo(target.textContent.includes('登录')?'login':'help');
});
document.addEventListener('submit',async event=>{
 const form=event.target;
 if(form.id==='experimentForm'){event.preventDefault();const raw=$('#expChange').value;runScenario($('#expLever').value,raw.trim()===''?NaN:Number(raw),$('#expPrompt').value);return;}
 if(form.id==='draftForm'){event.preventDefault();try{const title=$('#draftTitle').value.trim(),body=$('#draftBody').value.trim();if(!title||!body)throw Error();const d={id:makeId(),title,body,kind:form.dataset.kind,createdAt:new Date().toISOString()};await commit({...state,drafts:[d,...state.drafts].slice(0,50)});$('#detailModal').close();toast('草稿已保存，尚未对外执行。');}catch(error){$('#draftError').textContent=errorMessage(error);}return;}
 if(form.id==='reportForm'){event.preventDefault();try{const scenario=state.scenarios.find(r=>r.id===form.dataset.scenario)??null;const report=createReport($('#reportTitle').value,state.snapshot,scenario);await commit({...state,reports:[report,...state.reports].slice(0,50),selectedReportId:report.id});$('#detailModal').close();setView('report');toast('报告已保存到'+place+'。');}catch(error){$('#reportError').textContent=errorMessage(error);}return;}
 if(form.id==='noteForm'){event.preventDefault();const r=selectedReport();if(!r)return;try{await commit({...state,reports:state.reports.map(x=>x.id===r.id?{...x,note:$('#reportNote').value}:x)});toast('人工备注已保存。');}catch(error){$('#noteError').textContent=errorMessage(error);}return;}
 if(form.id==='emailForm'){event.preventDefault();try{const to=$('#emailTo').value.trim();if(!to||!$('#emailTo').checkValidity()){$('#emailError').textContent='请填写有效的收件人邮箱。';return;}const d={id:makeId(),title:'邮件：'+selectedReport().title,body:'收件人：'+to+'\n'+$('#emailBody').value,kind:'email',createdAt:new Date().toISOString()};await commit({...state,drafts:[d,...state.drafts].slice(0,50)});$('#detailModal').close();toast('邮件草稿已保存，尚未发送。');}catch(error){$('#emailError').textContent=errorMessage(error);}}
});
document.addEventListener('keydown',event=>{
 if(!$('#app'))return;
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setMode('app');$('#searchInput').focus();return;}
 if(event.key==='Escape'){$('#searchResults').classList.add('hidden');$('#searchInput').setAttribute('aria-expanded','false');}
 const el=event.target;
 if(el.matches('[data-persona-filter]')&&['ArrowRight','ArrowLeft'].includes(event.key)){event.preventDefault();const tabs=$$('[data-persona-filter]'),i=tabs.indexOf(el),next=tabs[(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];next.focus();next.click();return;}
 if((el.id==='searchInput'||el.closest('#searchResults'))&&['ArrowDown','ArrowUp','Enter'].includes(event.key)){
  const buttons=$$('#searchResults button');if(!buttons.length)return;
  if(event.key==='Enter'&&el.id==='searchInput'){event.preventDefault();buttons[0].click();$('#searchInput').value='';return;}
  if(event.key!=='Enter'){event.preventDefault();const i=buttons.indexOf(el);buttons[(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}return;
 }
 if(el.matches('[role=button]')&&!el.matches('button')&&['Enter',' '].includes(event.key)){event.preventDefault();el.click();}
});
$('#searchInput').addEventListener('input',renderSearch);
function routeFromHash(){const id=location.hash.startsWith('#app/')?location.hash.slice(5):location.hash.slice(1);return NAV.some(n=>n[0]===id)?id:null;}
window.addEventListener('popstate',()=>{const route=routeFromHash();if(!$('#app')||!route)return;setView(route,false);const context=history.state?.bwaFlow;showFlowContext(context?.text,context?.origin,false);});
window.addEventListener('hashchange',()=>{const route=routeFromHash();if(!$('#app')){if(route||location.hash==='#landing')location.reload();return;}if(route)setView(route,false);else if(location.hash==='#landing')setMode('landing');});
// Initialize the nine real surfaces, then apply only typed persisted user records.
setupExamples();setupExperiment();
$$('#appNav .navbtn').forEach(b=>b.setAttribute('aria-label',NAV.find(n=>n[0]===b.dataset.view)?.[1]??b.textContent));
$$('.evidence .panel-head a').forEach(a=>{const b=document.createElement('button');b.className='action-link';b.textContent='查看来源';b.dataset.sourceEvidence='';a.replaceWith(b);});
$$('.scenario-log .panel-head a').forEach(a=>{const b=document.createElement('button');b.className='action-link';b.textContent='查看全部情景';b.dataset.history='';a.replaceWith(b);});
$('.graph-scroll').insertAdjacentHTML('beforebegin','<div class="toolbar"><button class="btn" data-zoom="-0.1" aria-label="缩小关系图">−</button><span id="zoomValue">100%</span><button class="btn" data-zoom="0.1" aria-label="放大关系图">+</button><span class="tiny muted">可横向滚动查看全部节点</span></div>');
$$('#view-world th').forEach(th=>th.scope='col');
$$('#view-world table').forEach(t=>{const w=document.createElement('div');w.className='table-scroll';w.tabIndex=0;w.setAttribute('aria-label','记录表，可横向滚动');t.before(w);w.append(t);});
if(client.shared){$('#sourceModal .modal-head p').textContent='保存到当前工作区，与本账户的 Agent 共用。人工录入不等于来源已经核验。';$('#workflow .step p').textContent='填写指标和来源说明，保存到当前工作区。';}
renderAll();
if(client.shared&&!location.hash.startsWith('#report=')){try{const result=await client.load();state=result.state;readError=result.error;}catch(error){readError=error.code??'connection-unavailable';}renderAll();}
if(location.hash.startsWith('#report='))showSharedReport();else{
 if(routeFromHash()){setView(routeFromHash(),false);const context=history.state?.bwaFlow;if(context?.view===view)showFlowContext(context.text,context.origin,false);}else setMode('landing');
 if(client.shared&&client.ready){const query=new URLSearchParams(location.search);if(query.get('search')){$('#searchInput').value=query.get('search').slice(0,200);renderSearch();}if(query.get('source')==='1')openSource();}
}

function openShare(){
 const report=selectedReport();if(!report)return;
 openDetail('分享只读副本','<p>链接包含本报告的经营记录、来源备注、情景和人工备注。任何拿到链接的人都能读取内容；它不是加密或可撤销的访问权限，也不会随之后的记录变化自动更新。请勿用于敏感信息。</p><form id="shareForm"><label><input id="shareConsent" type="checkbox" required> 我确认可以分享这份报告的完整内容。</label><p id="shareError" class="form-error" role="alert"></p><button class="btn primary" type="submit">生成只读副本链接</button></form>');
}
document.addEventListener('submit',event=>{
 if(event.target.id!=='shareForm')return;event.preventDefault();if(!$('#shareConsent').checked)return;
 try{const url=new URL(location.href);if(client.shared){url.pathname='/business-world/ui.html';url.search='';}url.hash='report='+shareReportToken(selectedReport());$('#detailBody').innerHTML='<p>只读副本已生成。链接持有人可读取内容，不能修改你的原始报告。副本不能撤销，请谨慎分享。</p><label for="shareLink">只读副本链接</label><textarea id="shareLink" class="share-link" readonly></textarea><div class="toolbar"><button class="btn" data-copy-share>复制链接</button><a class="btn" id="openSharedReport" target="_blank" rel="noopener noreferrer">打开只读副本</a></div>';$('#shareLink').value=url.href;$('#openSharedReport').href=url.href;}catch{$('#shareError').textContent='暂时无法生成链接，请缩短报告备注或改用导出文件。';}
});
document.addEventListener('click',async event=>{if(!event.target.closest('[data-copy-share]'))return;const input=$('#shareLink');try{await navigator.clipboard.writeText(input.value);toast('只读副本链接已复制。');}catch{input.focus();input.select();toast('请复制已选中的链接。');}});
function showSharedReport(){
 try{const report=readSharedReport(location.hash.slice(8));const doc=new DOMParser().parseFromString(reportHtml(report),'text/html');document.title=report.title+' · 只读副本';document.body.replaceChildren();const main=document.createElement('main');main.className='shared-report';main.id='sharedReport';main.innerHTML='<p class="example-notice">只读副本 · 由分享者提供，尚未核验。副本不能修改原工作区的记录。</p>'+doc.body.innerHTML;document.body.append(main);$('#printReport').onclick=()=>window.print();}catch{document.body.innerHTML='<main class="shared-report"><h1>无法打开这份报告</h1><p>链接不完整或内容无效。请向分享者索取新的链接。</p></main>';}
}
