'use client';

import type { EntityKind } from '@/lib/business-world/entity-links';
import { BusinessSearch, EntitySearchDetail } from './_components/business-search';
import { localObservationMinute, observationTimeForSave } from '@/lib/business-world/source-editor';
import { presentSnapshot } from '@/lib/business-world/presentation';
import { publicErrorMessage, publicMessages } from '@/lib/business-world/public-errors';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3, Box, ClipboardList, Database, FlaskConical, Home, Package, Play,
  Radio, RefreshCw, Save, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import {
  OverviewRestored, PersonaRestored, WorldRestored, ContentRestored, LiveRestored,
  GrowthRestored, ProductRestored, ExperimentRestored, ReportRestored,
} from './_components/business-world-screens';

type Payload = {
  meta: { dataMode: 'simulated' | 'observed'; datasetVersion: string; designSource: string; warning: string };
  personas: Array<{
    id: string; name: string; title: string; goal: string; pain: string; content: string; trigger: string;
    population: number | null; conversionRate: number | null; repeatRate: number | null; gmvShare: number | null;
  }>;
  content: {
    engagementRate: number | null; weeklyOpportunities: number | null; totalPlays: number | null; interactions: number | null;
    topTopics: Array<{ title: string; persona: string; potential: string }>;
    scripts: Array<{ name: string; durationSec: number; format: string }>;
  };
  live: {
    funnel?: import('@/lib/business-world/live-funnel').LiveFunnel;
    roomEntryRate: number | null; cartRate: number | null; avgWatchSec: number | null; payConversionRate: number | null;
    exposureUv: number | null; watchUv: number | null; peakOnline: number | null; paidOrders: number | null; gmv: number | null;
    sessions: Array<{ id: string; title: string; durationMin: number; watchUv: number; cartRate: number; paidOrders: number; gmv: number }>;
  };
  commerce: {
    conversionRate: number | null; gmv: number | null; newCustomers: number | null; refundRate: number | null;
    sellThroughRate: number | null; aov: number | null;
    products: Array<{ id: string; name: string; size: string; price: number; gmv: number; conversionRate: number; stockDays: number; refundRate: number; image: string }>;
  };
  ads: {
    budget: number | null; spend: number | null; roi: number | null; cpa: number | null; ctr: number | null; newCustomerCost: number | null;
    channelMix: Array<{ channel: string; share: number }>;
    campaigns: Array<{ id: string; name: string; channel: string; budget: number; spend: number; ctr: number; cpa: number; roi: number; status: string }>;
    creatives: Array<{ name: string; roi: number }>;
  };
  report: { period: string; audience: string; headline: string; summary: string; sections: string[] };
  notes: string;
};

type Snapshot = {
  provenance: {
    sourceMode: 'persisted-observation' | 'simulated' | 'unavailable';
    provider: string;
    sourceLabel: string;
    asOf: string | null;
    updatedAt: string | null;
    storage: string;
    writable: boolean;
  };
  data: Payload | null;
};

type NavId = 'overview' | 'persona' | 'world' | 'content' | 'live' | 'growth' | 'product' | 'experiment' | 'report';

const nav: Array<[NavId, string, typeof Home]> = [
  ['overview', '总览', Home], ['persona', 'Persona Studio', Users], ['world', 'World Builder', Sparkles],
  ['content', '内容策略', ClipboardList], ['live', '直播作战室', Radio], ['growth', '投放优化', BarChart3],
  ['product', '商品分析', Package], ['experiment', '模拟实验', FlaskConical], ['report', '报告', Box],
];

const emptyPayload: Payload = {
  meta: { dataMode: 'simulated', datasetVersion: '', designSource: '', warning: '' },
  personas: [],
  content: { engagementRate: null, weeklyOpportunities: null, totalPlays: null, interactions: null, topTopics: [], scripts: [] },
  live: { roomEntryRate: null, cartRate: null, avgWatchSec: null, payConversionRate: null, exposureUv: null, watchUv: null, peakOnline: null, paidOrders: null, gmv: null, sessions: [] },
  commerce: { conversionRate: null, gmv: null, newCustomers: null, refundRate: null, sellThroughRate: null, aov: null, products: [] },
  ads: { budget: null, spend: null, roi: null, cpa: null, ctr: null, newCustomerCost: null, channelMix: [], campaigns: [], creatives: [] },
  report: { period: '', audience: '', headline: '', summary: '', sections: [] },
  notes: '',
};

const screenDescriptions: Record<NavId, string> = {
  overview: '从理解消费者，到发现经营的下一种可能。',
  persona: '理解每一种需要，让研究更靠近真实生活。',
  world: '连接消费者、内容与交易，探索经营世界如何协同。',
  content: '规划内容结构，用证据验证每一个创意。',
  live: '理解场次表现，让讲解与消费者需求相遇。',
  growth: '比较投放计划，把预算用在经过验证的方向。',
  product: '追踪商品表现、复购与长期价值。',
  experiment: '比较情景，明确假设，再决定下一步行动。',
  report: '可追溯的经营摘要，为下一次决策提供依据。',
};

function numberValue(value: string) {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function SourceBanner({ snapshot, onEdit }: { snapshot: Snapshot | null; onEdit: () => void }) {
  const mode = snapshot?.provenance.sourceMode;
  const connected = mode === 'persisted-observation' || mode === 'simulated';
  const simulated = mode === 'simulated';
  return <div className={`source-banner ${connected ? 'real' : 'missing'}`}>
    <div><ShieldCheck size={18}/><span><b>{simulated ? '演示数据 · 非真实经营记录' : connected ? '已连接数据源' : '尚未连接数据源'}</b>{connected ? `${snapshot?.provenance.sourceLabel} · ${snapshot?.provenance.provider}` : '连接后会在这里显示来源与更新时间'}</span></div>
    <button onClick={onEdit}>{connected ? '来源详情' : '连接数据'}</button>
  </div>;
}

function Header({ title, subtitle, onExperiment }: { title: string; subtitle: string; onExperiment: () => void }) {
  return <header className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div><button className="primary" onClick={onExperiment}><Play size={16}/>开始模拟</button></header>;
}

function DataEditor({ snapshot, onSaved, onClose, readOnly }: { snapshot: Snapshot | null; onSaved: () => void | Promise<void>; onClose: () => void; readOnly: boolean }) {
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.querySelector<HTMLElement>('.data-editor');
    const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? []);
    controls()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        const items = controls();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, [onClose]);
  const d = snapshot?.data ?? emptyPayload;
  const [sourceLabel, setSourceLabel] = useState(snapshot?.provenance.sourceLabel || '尚未连接来源');
  const [observedAt, setObservedAt] = useState(snapshot?.provenance.asOf ? localObservationMinute(snapshot.provenance.asOf) : '');
  const [values, setValues] = useState<Record<string, string>>({
    engagementRate: d.content.engagementRate?.toString() ?? '', weeklyOpportunities: d.content.weeklyOpportunities?.toString() ?? '',
    roomEntryRate: d.live.roomEntryRate?.toString() ?? '', cartRate: d.live.cartRate?.toString() ?? '',
    conversionRate: d.commerce.conversionRate?.toString() ?? '', gmv: d.commerce.gmv?.toString() ?? '', newCustomers: d.commerce.newCustomers?.toString() ?? '',
    budget: d.ads.budget?.toString() ?? '', roi: d.ads.roi?.toString() ?? '', cpa: d.ads.cpa?.toString() ?? '', notes: d.notes ?? '',
  });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const disabled = readOnly || saving;
  const set = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    if (readOnly) { setStatus('当前数据源为只读。获得写入权限后才能修改。'); return; }
    savingRef.current = true;
    setSaving(true);
    setStatus('保存中…');
    const payload: Payload = {
      ...d,
      meta: { ...d.meta, dataMode: 'simulated', warning: 'Synthetic demo dataset persisted in the database. It is not observed platform or customer data.' },
      content: { ...d.content, engagementRate: numberValue(values.engagementRate), weeklyOpportunities: numberValue(values.weeklyOpportunities) },
      live: { ...d.live, roomEntryRate: numberValue(values.roomEntryRate), cartRate: numberValue(values.cartRate) },
      commerce: { ...d.commerce, conversionRate: numberValue(values.conversionRate), gmv: numberValue(values.gmv), newCustomers: numberValue(values.newCustomers) },
      ads: { ...d.ads, budget: numberValue(values.budget), roi: numberValue(values.roi), cpa: numberValue(values.cpa) },
      notes: values.notes,
    };
    try {
      const response = await fetch('/api/business-world/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceLabel, sourceType: 'simulated', observedAt: observationTimeForSave(observedAt, snapshot?.provenance.asOf), payload }) });
      const body = await response.json(); if (!response.ok) throw new Error(publicErrorMessage(body, 'SAVE_FAILED'));
      setStatus('演示数据已保存'); await onSaved();
    } catch (error) { setStatus(error instanceof Error && Object.values(publicMessages).some(message => message === error.message) ? error.message : publicMessages.SAVE_FAILED); }
    finally { savingRef.current = false; setSaving(false); }
  }
  const fields: Array<[string, string, string]> = [['engagementRate','内容互动率','%'],['weeklyOpportunities','本周内容机会','条'],['roomEntryRate','直播进房率','%'],['cartRate','直播加购率','%'],['conversionRate','商品转化率','%'],['gmv','GMV','元'],['newCustomers','新客数','人'],['budget','投放预算','元'],['roi','ROI',''],['cpa','CPA','元']];
  return <div className="editor-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><form className="data-editor" role="dialog" aria-modal="true" aria-labelledby="data-source-title" onSubmit={submit}><div className="editor-head"><div><b id="data-source-title">{readOnly ? '经营数据源' : '编辑演示数据'}</b><span>{readOnly ? '当前来源为只读；暂未提供的指标会保持为空。' : '保存后会更新各页面使用的演示数据，刷新页面仍然保留。'}</span></div><button type="button" aria-label="关闭数据源面板" onClick={onClose}>×</button></div><label>来源名称<input required minLength={2} maxLength={120} disabled={disabled} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)}/></label><label>观测时间<input required disabled={disabled} type="datetime-local" value={observedAt} onChange={e => setObservedAt(e.target.value)}/></label><div className="field-grid">{fields.map(([key,label,unit]) => <label key={key}>{label}<div className="unit-input"><input type="number" step="any" min={0} max={unit === '%' ? 100 : undefined} disabled={disabled} value={values[key]} onChange={e => set(key,e.target.value)}/><span>{unit}</span></div></label>)}</div><label>来源说明 / 备注<textarea maxLength={4000} disabled={disabled} value={values.notes} onChange={e => set('notes',e.target.value)} placeholder="例如：本次比较采用的假设、适用范围与注意事项。"/></label><div className="editor-actions"><span role="status" aria-live="polite">{status}</span><button className="primary" type="submit" disabled={disabled}><Save size={16}/>{readOnly ? '只读来源' : saving ? '保存中…' : '保存演示数据'}</button></div></form></div>;
}

export default function App() {
  const [active, setActive] = useState<NavId>('overview');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [entityId,setEntityId]=useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const closeEditor = useCallback(() => setEditing(false), []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (editing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === 'Escape') {
        setSearch('');
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [editing]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await fetch('/api/business-world/state', { cache: 'no-store' }); const body = await response.json(); if (!response.ok) throw new Error(publicErrorMessage(body, 'READ_FAILED')); setSnapshot(presentSnapshot(body)); }
    catch (err) { setSnapshot(null); setError(publicMessages.READ_FAILED); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = [params.get("screen"), window.location.hash.slice(1)].find(value => nav.some(([id]) => id === value)) as NavId | undefined;
    if (requested && nav.some(([id]) => id === requested)) setActive(requested);
    const requestedSearch = params.get("search");
    if (requestedSearch) setSearch(requestedSearch);
    setEntityId(params.get("entity") ?? "");
    if (params.get("source") === "1") setEditing(true);
  }, []);

  const goTo = useCallback((id: NavId) => {
    setActive(id);
    setSearch('');
    setEntityId('');
    const url = new URL(window.location.href);
    url.searchParams.delete('entity');
    url.searchParams.delete('search');
    if (id === 'overview') url.searchParams.delete('screen');
    else url.searchParams.set('screen', id);
    url.hash = id;
    window.history.replaceState(null, '', url);
  }, []);

  const clearEntity = useCallback(()=>{setEntityId('');const url=new URL(location.href);url.searchParams.delete('entity');history.replaceState(null,'',url);},[]);
  const selectEntity = useCallback((kind: EntityKind,id: string)=>{const entity=`${kind}:${id}`;setEntityId(entity);const url=new URL(location.href);url.searchParams.set('entity',entity);history.replaceState(null,'',url);},[]);
  const data = snapshot?.data ?? null;
  const view =
    active === 'overview' ? <OverviewRestored data={data}/> :
    active === 'persona' ? <PersonaRestored data={data} onEntity={selectEntity} onClearEntity={clearEntity} onSource={()=>setEditing(true)}/> :
    active === 'world' ? <WorldRestored snapshot={snapshot} onSource={()=>setEditing(true)}/> :
    active === 'content' ? <ContentRestored data={data} onEntity={selectEntity}/> :
    active === 'live' ? <LiveRestored data={data} onSource={()=>setEditing(true)}/> :
    active === 'growth' ? <GrowthRestored data={data} onClearEntity={clearEntity} onSource={() => setEditing(true)}/> :
    active === 'product' ? <ProductRestored data={data} onSource={() => setEditing(true)}/> :
    active === 'experiment' ? <ExperimentRestored snapshot={snapshot}/> :
    <ReportRestored snapshot={snapshot}/>;

  return <main className={`app-shell screen-${active}`}><aside className="sidebar"><div className="brand"><div><span className="brand-wordmark">eve</span><b>Business World</b><small>DIAPER OPERATING SYSTEM</small></div></div><nav>{nav.map(([id,label,Icon]) => <button key={id} className={active===id?'active':''} aria-label={label} aria-current={active===id?'page':undefined} onClick={() => goTo(id)}><Icon size={18}/><span>{label}</span></button>)}</nav><a href="?screen=experiment" className="sidebar-promo" aria-label="模拟工作区"><Box size={25}/><div>模拟工作区<small>建模 · 验证 · 成长<br/>让每一次决策更可靠</small></div></a></aside><section className="workspace"><div className="topbar"><BusinessSearch snapshot={snapshot} pages={nav.map(([id,label])=>[id,label] as const)} query={search} setQuery={setSearch} inputRef={searchRef}/><button className="date" onClick={() => void load()}><RefreshCw size={13}/>刷新</button><button className="team" onClick={() => { window.location.href = "/chat"; }}><Sparkles size={13}/>问 Agent</button><button className="team" onClick={() => setEditing(true)}><Database size={13}/>数据源</button></div><div className="canvas"><Header title={nav.find(([id]) => id === active)?.[1] ?? 'Business World'} subtitle={screenDescriptions[active]} onExperiment={() => goTo('experiment')}/><SourceBanner snapshot={snapshot} onEdit={() => setEditing(true)}/>{loading ? <section className="panel empty-panel">正在读取经营数据…</section> : error ? <section className="panel empty-panel"><h3>数据暂时不可用</h3><p>{error}</p><button className="primary" onClick={() => void load()}>重试</button></section> : <>{entityId && active !== 'world' && <EntitySearchDetail snapshot={snapshot} entityId={entityId} onClose={()=>{setEntityId('');const url=new URL(location.href);url.searchParams.delete('entity');history.replaceState(null,'',url);}} onSource={()=>setEditing(true)}/>} {view}</>}</div></section>{editing && !loading && <DataEditor snapshot={snapshot} onSaved={load} onClose={closeEditor} readOnly={!snapshot?.provenance.writable}/>}</main>;
}
