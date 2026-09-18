import {METRICS,userText as escape,formatMetric} from './ui-state.mjs';

// Product copy and route contracts, kept separate from persistence and transport.
export const SCREENS = Object.freeze({
 overview:{number:'01',label:'经营总览',english:'BUSINESS OVERVIEW',title:'把经营记录，变成下一步行动。',description:'从消费者洞察到内容、直播与增长，在同一个工作区看清依据、比较选择、整理行动。',next:'world',nextLabel:'查看商业关系',icon:'◎',stage:0,metrics:['gmv','conversion','roi','repeat']},
 persona:{number:'02',label:'消费者洞察',english:'PERSONA STUDIO',title:'先理解人，再决定如何沟通。',description:'把待验证的人群假设整理成研究任务，再带着人群背景进入内容策略。',next:'content',nextLabel:'带着人群问题做内容',icon:'♙',stage:1,metrics:[]},
 world:{number:'03',label:'业务数据',english:'WORLD BUILDER',title:'看见指标之间的关系。',description:'从一条经营记录出发，查看来源、探索关联因素，再比较不同假设。关联不等于因果。',next:'experiment',nextLabel:'比较一个经营假设',icon:'◇',stage:0,metrics:[]},
 content:{number:'04',label:'内容策略',english:'CONTENT STRATEGY',title:'把用户需求，写成值得看的内容。',description:'明确人群、要传递的信息与业务依据，先形成内容提纲，再整理发布计划。',next:'live',nextLabel:'衔接直播运营',icon:'▤',stage:2,metrics:['engagement']},
 live:{number:'05',label:'直播运营',english:'LIVE OPERATIONS',title:'让每一场直播，都有准备和复盘。',description:'从观看记录与商品线索出发，整理开播准备、讲解要点和复盘任务。',next:'product',nextLabel:'查看关联商品',icon:'▣',stage:2,metrics:['live','conversion']},
 growth:{number:'06',label:'投放优化',english:'GROWTH OPTIMIZATION',title:'先比较假设，再讨论预算。',description:'查看广告投入产出记录，将效率变化带入情景实验。这里不会调整真实投放。',next:'experiment',nextLabel:'比较广告效率假设',icon:'↗',stage:3,metrics:['roi','gmv']},
 product:{number:'07',label:'商品分析',english:'PRODUCT ANALYSIS',title:'让好商品，找到更合适的机会。',description:'结合成交、转化与复购记录提出商品问题。SKU 销量、库存和利润需要独立证据。',next:'growth',nextLabel:'衔接投放策略',icon:'▢',stage:1,metrics:['gmv','conversion','repeat']},
 experiment:{number:'08',label:'情景实验',english:'SCENARIO EXPERIMENTS',title:'在行动之前，多比较一种可能。',description:'明确基准、杠杆和变化幅度。估算结果与原始记录分开保存，不作为销量预测。',next:'report',nextLabel:'整理为经营报告',icon:'⚗',stage:3,metrics:[]},
 report:{number:'09',label:'经营报告',english:'BUSINESS REPORTS',title:'把依据和选择，交代清楚。',description:'将固定的经营记录与情景假设整理成报告，补充人工意见，再明确选择导出或分享。',next:'overview',nextLabel:'回到经营总览',icon:'▧',stage:4,metrics:[]},
});
const e=escape;
const journeys=[['world','整理数据'],['persona','理解人群'],['content','准备行动'],['experiment','比较假设'],['report','汇总复盘']];
function button(label,attributes,primary=false){return `<button class="btn ${primary?'primary':''}" ${attributes}>${e(label)}<span aria-hidden="true"> ↗</span></button>`;}
function nextButton(id){const s=SCREENS[id];if(id==='experiment')return button(s.nextLabel,'data-scenario-report',true);if(id==='growth')return button(s.nextLabel,'data-simulate="ads"',true);return button(s.nextLabel,`data-handoff="${s.next}" data-origin="${id}"`,true);}
export function screenHero(id){
 const s=SCREENS[id];
 return `<header class="screen-hero" data-screen-hero="${id}"><div class="screen-copy"><div class="screen-eyebrow"><span>${s.number}</span> ${s.english}</div><h1 tabindex="-1">${e(s.title)}</h1><p>${e(s.description)}</p><div class="hero-actions">${id==='overview'?button('添加 / 更新经营记录','data-open-source',true):nextButton(id)}${id==='overview'?button('查看商业关系','data-handoff="world" data-origin="overview"'):button('查看经营来源','data-open-source')}</div></div><div class="screen-art" aria-hidden="true"><div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><span class="art-node node-one">来源</span><span class="art-node node-two">行动</span><div class="art-core">${s.icon}</div><span class="art-tag">${e(s.label)}</span></div></header>`;
}
export function journey(id){const stage=SCREENS[id].stage;return `<nav class="journey-nav" aria-label="经营决策流程">${journeys.map(([route,label],i)=>`<button class="journey-step ${i===stage?'current':''}" data-handoff="${route}" data-origin="${id}" ${i===stage?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${label}<i aria-hidden="true">${i<4?'→':'✓'}</i></button>`).join('')}</nav>`;}
function metrics(keys,snapshot,unknown){return `<div class="workbench-metrics">${keys.map(key=>`<button class="workbench-metric" data-metric="${key}" aria-label="查看${METRICS[key].label}详情"><span class="metric-icon" aria-hidden="true">${key==='gmv'?'¥':key==='roi'?'↗':'◫'}</span><span class="metric-name">${e(METRICS[key].label)}</span><strong>${unknown?'—':e(formatMetric(key,snapshot?.metrics[key]))}</strong><small>${unknown?'暂时无法读取':snapshot?'人工录入 · 尚未核验':'尚无记录'}</small><span class="metric-arrow" aria-hidden="true">↗</span></button>`).join('')}</div>`;}
const actions={
 overview:[['准备内容提纲','从目标人群与沟通主题开始。','data-work-draft="brief" data-origin="content"','▤'],['准备直播任务','先记录目标与需要核对的商品。','data-work-draft="task" data-origin="live"','▣'],['比较投放假设','固定基准，再比较效率变化。','data-simulate="ads"','↗']],
 persona:[['整理人群研究问题','记录行为假设、待收集证据和验证方法。','data-work-draft="task" data-origin="persona"','♙'],['查看人群案例','浏览明确标记的案例，不代替真实用户证据。','data-open-examples="persona"','◎'],['进入内容策略','带着人群研究背景继续，而不是从空白开始。','data-handoff="content" data-origin="persona"','▤']],
 content:[['创建内容提纲','填写目标人群、核心信息和经营依据。','data-work-draft="brief" data-origin="content"','▤'],['整理发布计划','先确认渠道与时间；保存不等于发布。','data-work-draft="plan" data-origin="content"','▦'],['回看人群问题','检查内容是否回应了明确的人群需求。','data-handoff="persona" data-origin="content"','♙']],
 live:[['准备开播清单','整理商品、讲解要点与待确认事项。','data-work-draft="task" data-origin="live"','▣'],['查看商品背景','把直播目标与商品问题放在一起。','data-handoff="product" data-origin="live"','▢'],['创建复盘任务','明确记录、证据和下一次改进。','data-work-draft="task" data-origin="live" data-draft-purpose="复盘"','▧']],
 growth:[['比较广告效率','打开预填的广告效率情景，不直接改预算。','data-simulate="ads"','↗'],['整理投放建议','将目标、依据和风险保存为待确认草稿。','data-work-draft="plan" data-origin="growth"','◈'],['查看内容策略','回看广告承诺与实际内容是否一致。','data-handoff="content" data-origin="growth"','▤']],
 product:[['整理商品问题','先核对 SKU 来源，再讨论库存或利润。','data-work-draft="task" data-origin="product"','▢'],['比较转化假设','用已有基准比较转化率变化。','data-simulate="conversion"','↗'],['研究关联人群','带着商品问题，回到消费者洞察。','data-handoff="persona" data-origin="product"','♙']],
};
function actionCards(id){return `<section class="action-grid" aria-label="${SCREENS[id].label}下一步">${(actions[id]||[]).map(([title,description,attributes,icon])=>`<button class="action-card" ${attributes}><span class="action-icon" aria-hidden="true">${icon}</span><b>${e(title)}</b><p>${e(description)}</p><span class="action-arrow" aria-hidden="true">↗</span></button>`).join('')}</section>`;}
function sourceCard(snapshot,unknown,place){return `<section class="work-source-card"><div class="section-heading"><h3>数据准备情况</h3><span class="status-pill ${unknown?'is-warning':''}">${unknown?'待恢复':snapshot?'人工记录':'尚待添加'}</span></div><div class="source-row"><span class="source-icon" aria-hidden="true">▱</span><div><b>${unknown?'暂时无法读取工作区':snapshot?e(snapshot.name):'添加第一条经营记录'}</b><p>${unknown?'请恢复连接后刷新。未将未读取的记录当作空记录。':snapshot?'记录保存于'+e(place)+'，人工录入尚未核验。':'记录指标、统计周期与来源说明，让后续行动有依据。'}</p></div></div>${button(snapshot?'查看 / 更新来源':'添加经营记录','data-open-source')}<p class="boundary-copy">平台自动同步尚未接入；不会显示虚构的已连接状态。</p></section>`;}
export function renderRecordSurface(id,state,{unknown=false,place='此设备'}={}){
 const s=SCREENS[id];
 const evidence=unknown?'暂时无法读取工作区记录，请恢复连接后刷新。':id==='persona'?'尚无人群证据。总量记录不能推导出人数、行为分布或置信度。':!state.snapshot?'尚未添加经营记录。先添加来源，再比较经营假设。':`当前来源：${state.snapshot.name}。以下为人工录入记录，尚未核验。`;
 return `${screenHero(id)}${journey(id)}<div class="record-surface-heading"><h2>${e(s.label)}</h2><span class="status-pill">${unknown?'待恢复':state.snapshot?'人工录入 · 尚未核验':'从第一条记录开始'}</span></div><p class="record-explanation">${e(evidence)}</p>${s.metrics.length?metrics(s.metrics,state.snapshot,unknown):`<div class="research-boundary"><span aria-hidden="true">◎</span><div><b>先建立人群证据</b><p>${e(evidence)}</p></div>${button('整理研究任务','data-work-draft="task" data-origin="persona"')}</div>`}${actionCards(id)}${id==='overview'?`<div class="overview-bottom">${sourceCard(state.snapshot,unknown,place)}<section class="work-progress"><div class="section-heading"><h3>当前工作成果</h3><span class="muted">仅统计本工作区</span></div><div class="progress-counts">${[['行动草稿',state.drafts.length,'content'],['已存情景',state.scenarios.length,'experiment'],['经营报告',state.reports.length,'report']].map(([label,count,to])=>`<button data-view="${to}"><strong>${unknown?'—':count}</strong><span>${label}</span></button>`).join('')}</div><p>草稿尚未对外执行，情景不是预测。保存后的结果可继续查看与整理。</p>${button('整理经营报告','data-view="report"')}</section></div>`:''}<div class="legacy-actions toolbar">${button('创建行动草稿','data-new-draft="task"')}${id==='overview'?button('比较经营情景','data-view="experiment"'):''}</div>`;
}
export function syncWorkbench(id){
 document.body.dataset.activeScreen=id;
 const cfg=SCREENS[id];
 const crumb=document.querySelector('#currentScreen');if(crumb)crumb.textContent=cfg.label;
 for(const route of ['world','experiment','report']){
  const section=document.querySelector('#view-'+route);if(!section||section.querySelector('[data-screen-hero]'))continue;
  section.insertAdjacentHTML('afterbegin',screenHero(route)+journey(route));
 }
 document.querySelectorAll('#appNav [data-view]').forEach(b=>{const s=SCREENS[b.dataset.view];b.title=s.label+' · '+s.english;const label=b.querySelector('span:last-child');if(label)label.textContent=s.label;});
}
export function draftSeed(origin,kind,purpose='',context=''){
 const s=SCREENS[origin]||SCREENS.overview;
 const templates={persona:'人群假设：\n已有证据：\n待收集的行为 / 订单证据：\n验证方法：',content:'目标人群：\n核心信息：\n经营依据：\n内容形式：\n需要人工确认的事项：',live:'直播目标：\n关联商品：\n讲解要点：\n开播前待确认事项：\n复盘依据：',growth:'投放目标：\n关联内容与商品：\n经营依据：\n情景假设：\n风险与待确认事项：',product:'关联商品 / SKU：\n需要核对的来源：\n消费者问题：\n验证方法：'};
 return {title:s.label+(purpose?' · '+purpose:'')+' · '+({brief:'内容提纲',plan:'行动计划',task:'研究任务'}[kind]||'行动草稿'),body:(context?'前序背景：'+context+'\n\n':'')+(templates[origin]||'目标：\n依据：\n下一步：')};
}
