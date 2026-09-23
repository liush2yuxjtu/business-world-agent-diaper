'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Database, Globe2, Layers3, RefreshCw, Search, Sparkles, Users } from 'lucide-react';
import catalog from '@/lib/roadshow/catalog.json';
import type { BusinessSnapshot } from '../business-world-restored';
import { ScenarioRunner, formatMetric } from './scenario-runner';
import './world-model.css';

type Persona = (typeof catalog.personas)[number];
type AgentState = 'neutral' | 'thinking' | 'simulating' | 'recommendation' | 'alert';
export const personaAsset = (p: Persona) => `/roadshow-assets/personas/${p.group}/${p.id}.svg`;

export function useBusinessSnapshot() {
  const [snapshot, setSnapshot] = useState<BusinessSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/business-world/state', {cache:'no-store',signal:AbortSignal.timeout(30000)});
      const body = await response.json();
      if (!response.ok || !body.provenance || !body.data) throw new Error('经营数据暂时不可用，请重试。');
      setSnapshot(body);
    } catch (e) { setSnapshot(null); setError(e instanceof Error ? e.message : '读取失败，请重试。'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return {snapshot, error, loading, refresh};
}

export function WorldNav() {
  return <header className="wm-nav"><a className="wm-brand" href="/landing"><img src="/roadshow-assets/world/world-agent-core.svg" alt=""/>Business World Agent</a><nav aria-label="路演导航"><a href="/world">经营世界</a><a href="/roadshow">路演</a><a href="/roadshow-assets">资产</a><a className="wm-nav-cta" href="/?screen=experiment">Product Demo <ArrowUpRight size={15}/></a></nav></header>;
}

export function WorldStage({personaId,onPersona,state='neutral',group='consumer'}: {personaId:string;onPersona:(id:string)=>void;state?:AgentState;group?:string}) {
  const personas = catalog.personas.filter(p=>p.group===group);
  return <div className={`wm-stage state-${state}`}>
    <img className="wm-globe" src="/roadshow-assets/world/world-model-globe.svg" alt="商业区域关系示意球体"/>
    <svg className="wm-connections" viewBox="0 0 900 560" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="url(#wm-wire)" strokeWidth="1.2"><defs><linearGradient id="wm-wire"><stop stopColor="#77D7D5" stopOpacity=".45"/><stop offset=".5" stopColor="#B3A6F3" stopOpacity=".7"/><stop offset="1" stopColor="#77D7D5" stopOpacity=".45"/></linearGradient></defs>{[90,215,340,465].map(y=><path key={y} d={`M135 ${y}Q330 ${y} 450 280Q590 ${y} 765 ${y}`}/>)}</g></svg>
    <div className="wm-agent"><div className="wm-agent-halo"/><img src={`/roadshow-assets/world/world-agent-${state}.svg`} alt="World Agent"/><strong>World Agent</strong><span>{catalog.agentStates.find(s=>s.id===state)?.name}</span><small>角色 · 证据 · 情景</small></div>
    <div className="wm-persona-orbit">{personas.map((p,i)=><button key={p.id} className={`wm-persona-node ${personaId===p.id?'selected':''}`} style={{gridColumn:i<4?1:3,gridRow:i%4+1}} onClick={()=>onPersona(p.id)} aria-pressed={personaId===p.id}><img src={personaAsset(p)} alt=""/><span><b>{p.name}</b><small>{p.kpi}</small></span></button>)}</div>
    <span className="wm-map-caption">关系示意 · 非实时地理数据</span>
  </div>;
}

export function WorldModelExplorer({snapshot}:{snapshot:BusinessSnapshot|null}) {
  const [personaId, setPersonaId] = useState('new-parents');
  const [group, setGroup] = useState('consumer');
  const [entityId, setEntityId] = useState('consumer');
  const [eventId, setEventId] = useState('stock-risk');
  const [scenarioId, setScenarioId] = useState('inventory');
  const [region, setRegion] = useState('asia');
  const [search, setSearch] = useState('');
  const [agentState, setAgentState] = useState<AgentState>('neutral');
  const persona = catalog.personas.find(p=>p.id===personaId) ?? catalog.personas[0];
  const observedPersona = snapshot?.data?.personas.find(p=>p.id===persona.sourceId);
  const entity = catalog.entities.find(e=>e.id===entityId) ?? catalog.entities[0];
  const event = catalog.events.find(e=>e.id===eventId) ?? catalog.events[0];
  const scenario = catalog.scenarios.find(s=>s.id===scenarioId) ?? catalog.scenarios[0];
  const lowStock = snapshot?.data?.commerce.products.filter(p=>p.stockDays<=7) ?? [];
  const matches = search.trim() ? catalog.personas.filter(p=>[p.name,p.goal,p.kpi].join(' ').toLowerCase().includes(search.toLowerCase())) : [];
  function selectPersona(id: string) {
    const p = catalog.personas.find(item=>item.id===id);
    if (!p) return;
    setPersonaId(id); setGroup(p.group); setEntityId(p.entity); setScenarioId(p.scenario); setAgentState('thinking'); setSearch('');
  }
  function selectEvent(id: string) {
    const e = catalog.events.find(item=>item.id===id);
    if (!e) return;
    setEventId(id); setEntityId(e.entity); setScenarioId(e.scenario); setAgentState(e.kind==='rule'&&lowStock.length?'alert':'thinking');
  }
  const currentRegion = catalog.regions.find(r=>r.id===region)?.name;
  return <div className="wm wm-explorer">
    <div className="wm-title-row"><div><p className="wm-eyebrow">DIAPER INDUSTRY / WORLD MODEL</p><h1>连接角色，理解商业世界</h1><p className="wm-muted">选一个人，查看相关实体与事件，再运行一次情景。</p></div><div className="wm-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索角色、需求…" aria-label="搜索世界角色"/>{search&&<div className="wm-search-results">{matches.length?matches.map(p=><button key={p.id} onClick={()=>selectPersona(p.id)}>{p.name}<ArrowRight size={14}/></button>):<p>没有匹配的角色</p>}</div>}</div></div>
    <div className="wm-source"><Database size={14}/><span>{snapshot?.data?.meta.dataMode==='observed'?'已连接经营快照':'Demo 数据库 · 合成数据'}</span><small>{snapshot?.provenance.storage ?? '等待连接'} · {snapshot?.provenance.asOf ? new Date(snapshot.provenance.asOf).toLocaleDateString('zh-CN') : '暂无更新时间'}</small><span className="wm-source-count">{snapshot?.data?.personas.length??0} 类数据库人群 / 16 个角色模板</span></div>
    <div className="wm-layout"><div className="wm-main-column">
      <div className="wm-world-toolbar"><div className="wm-tabs" aria-label="角色类型">{[['consumer','家庭与消费者'],['business','业务伙伴']].map(([id,label])=><button key={id} aria-pressed={group===id} onClick={()=>{setGroup(id);selectPersona(catalog.personas.find(p=>p.group===id)!.id);}}><Users size={15}/>{label}</button>)}</div><label className="wm-region"><Globe2 size={14}/><select aria-label="区域模板" value={region} onChange={e=>setRegion(e.target.value)}>{catalog.regions.map(r=><option key={r.id} value={r.id}>{r.name} · 区域模板</option>)}</select></label></div>
      <WorldStage personaId={personaId} onPersona={selectPersona} state={agentState} group={group}/>
      <div className="wm-entity-strip" aria-label="商业实体">{catalog.entities.map(e=><button key={e.id} onClick={()=>setEntityId(e.id)} aria-pressed={entityId===e.id}><img src={`/roadshow-assets/entities/${e.id}.svg`} alt=""/><span>{e.name}</span></button>)}</div>
      <div className="wm-entity-context"><div><b>{entity.name}</b><span>{entity.detail} · {currentRegion}区域关系模板</span></div><a href={`/?screen=${entity.screen}`}>打开相关工作区<ArrowUpRight size={15}/></a></div>
    </div><aside className="wm-detail-column">
      <section className="wm-persona-detail" aria-label="角色详情"><p className="wm-eyebrow">{observedPersona?'数据库人群 · 合成数据':'角色模板 · 研究假设'}</p><div className="wm-detail-person"><img src={personaAsset(persona)} alt={`${persona.name}矢量头像`}/><div><h2>{persona.name}</h2><span>{observedPersona?.name??'业务角色 / 行为原型'}</span></div></div><dl><dt>目标</dt><dd>{observedPersona?.goal??persona.goal}</dd><dt>顾虑</dt><dd>{observedPersona?.pain??persona.pain}</dd><dt>触发条件</dt><dd>{observedPersona?.trigger??persona.trigger}</dd><dt>行为</dt><dd>{persona.behavior}</dd></dl>{observedPersona&&<div className="wm-persona-numbers"><div><small>转化率</small><b>{formatMetric(observedPersona.conversionRate,'%')}</b></div><div><small>复购率</small><b>{formatMetric(observedPersona.repeatRate,'%')}</b></div></div>}<p className="wm-next-action"><Sparkles size={16}/>{persona.action}</p><a className="wm-text-link" href="#scenario-runner">比较这个情景<ArrowRight size={15}/></a></section>
      <section className="wm-baseline"><div className="wm-section-head"><h3>经营基线</h3><span className="wm-tag">当前快照</span></div><div className="wm-kpi-grid">{[['GMV · 元',snapshot?.data?.commerce.gmv],['ROI',snapshot?.data?.ads.roi],['CPA · 元',snapshot?.data?.ads.cpa],['新客数',snapshot?.data?.commerce.newCustomers]].map(([label,value])=><div key={String(label)}><small>{String(label)}</small><strong>{formatMetric(typeof value==='number'?value:null)}</strong></div>)}</div><p className="wm-small">当前未接入区域趋势，不生成地区增长率。</p></section>
    </aside></div>
    <section className="wm-events-section"><div className="wm-section-head"><div><p className="wm-eyebrow">EVENTS / 商业事件</p><h2>发生什么，谁受影响？</h2></div><span className="wm-muted">1 条快照规则 / 7 个事件模板</span></div><div className="wm-events">{catalog.events.map(e=><button key={e.id} onClick={()=>selectEvent(e.id)} aria-pressed={eventId===e.id}><img src={`/roadshow-assets/events/${e.id}.svg`} alt=""/><b>{e.name}</b><small>{e.kind==='rule'?'基于快照的规则':'演示事件模板'}</small></button>)}</div><div className="wm-event-detail"><span className="wm-tag">{event.kind==='rule'?'规则推断':'演示假设'}</span><h3>{event.name}</h3><p>{event.kind==='rule'?(snapshot?.data?(lowStock.length?lowStock.map(p=>`${p.name}：库存覆盖 ${p.stockDays} 天`).join('；'):'当前商品均高于 7 天演示阈值。'):'等待数据库商品记录。'):event.detail}</p><span>{event.impact}。{event.action}。</span><button onClick={()=>{setScenarioId(event.scenario);document.getElementById('scenario-runner')?.scrollIntoView({behavior:'smooth'});}}>查看关联情景<ArrowRight size={15}/></button></div></section>
    <section className="wm-scenarios-section"><div className="wm-section-head"><div><p className="wm-eyebrow">SCENARIOS / 可比较的假设</p><h2>把讨论变成一次有记录的实验</h2></div><Layers3 size={24}/></div><div className="wm-scenario-grid">{catalog.scenarios.map(s=><button key={s.id} onClick={()=>setScenarioId(s.id)} aria-pressed={scenarioId===s.id}><img src={`/roadshow-assets/scenarios/${s.id}.svg`} alt=""/><span><b>{s.name}</b><small>{s.description}</small></span><ArrowUpRight size={16}/></button>)}</div>
      <ScenarioRunner snapshot={snapshot} scenario={scenario} context={`${persona.name}；${currentRegion}区域模板（未接入区域指标）`} onStatus={setAgentState}/>
    </section>
    <section className="wm-products-section"><div className="wm-section-head"><div><p className="wm-eyebrow">PRODUCTS / 产品与需求</p><h2>回到家庭每天使用的商品</h2></div><a href="/?screen=product">完整商品工作区<ArrowUpRight size={15}/></a></div><div className="wm-product-grid">{snapshot?.data?.commerce.products.map(p=><article key={p.id}><img src={`/roadshow-assets/diaper/pack-${p.id==='newborn'?'nb':p.id==='daily'?'m':'xl'}.svg`} alt={`${p.name}矢量概念包装`}/><div><p className="wm-eyebrow">{p.size}</p><h3>{p.name}</h3><p>¥{formatMetric(p.price)} · 库存覆盖 {formatMetric(p.stockDays)} 天</p><span className="wm-tag">数据库合成记录</span><small>包装为概念设计</small></div></article>)}</div></section>
  </div>;
}

export function WorldModelPage() {
  const {snapshot,error,loading,refresh} = useBusinessSnapshot();
  return <main className="wm wm-page"><WorldNav/><div className="wm-page-controls"><a href="/landing">产品介绍</a><button onClick={()=>void refresh()} disabled={loading}><RefreshCw size={14}/>{loading?'读取数据中…':'刷新经营数据'}</button></div>{error&&<div role="alert" className="wm-load-error">{error}<button onClick={()=>void refresh()}>重试</button></div>}<WorldModelExplorer snapshot={snapshot}/><footer className="wm-footer"><span>Business World Agent / Diaper Industry</span><span>共同基线，清晰假设，可回看的决策。</span></footer></main>;
}
