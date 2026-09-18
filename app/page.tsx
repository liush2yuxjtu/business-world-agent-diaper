'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Box, ClipboardList, Database, FlaskConical, Home, Package, Play,
  Radio, RefreshCw, Save, Search, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import {
  OverviewRestored, PersonaRestored, WorldRestored, ContentRestored, LiveRestored,
  GrowthRestored, ProductRestored, ExperimentRestored, ReportRestored,
} from './_components/business-world-restored';

type Payload = {
  content: { engagementRate: number | null; weeklyOpportunities: number | null };
  live: { roomEntryRate: number | null; cartRate: number | null };
  commerce: { conversionRate: number | null; gmv: number | null; newCustomers: number | null };
  ads: { budget: number | null; roi: number | null; cpa: number | null };
  notes: string;
};

type Snapshot = {
  provenance: {
    sourceMode: 'persisted-observation' | 'unavailable';
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
  content: { engagementRate: null, weeklyOpportunities: null },
  live: { roomEntryRate: null, cartRate: null },
  commerce: { conversionRate: null, gmv: null, newCustomers: null },
  ads: { budget: null, roi: null, cpa: null },
  notes: '',
};

function numberValue(value: string) {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function SourceBanner({ snapshot, onEdit }: { snapshot: Snapshot | null; onEdit: () => void }) {
  const real = snapshot?.provenance.sourceMode === 'persisted-observation';
  return <div className={`source-banner ${real ? 'real' : 'missing'}`}>
    <div><ShieldCheck size={18}/><span><b>{real ? '已连接数据源' : '尚未连接数据源'}</b>{real ? `${snapshot?.provenance.sourceLabel} · ${snapshot?.provenance.provider}` : '连接后会在这里显示来源与更新时间'}</span></div>
    <button onClick={onEdit}>{real ? (snapshot?.provenance.writable ? '更新来源' : '来源详情') : '连接数据'}</button>
  </div>;
}

function Header({ title, subtitle, onExperiment }: { title: string; subtitle: string; onExperiment: () => void }) {
  return <header className="page-head"><div><h1>{title}</h1><p>{subtitle}</p></div><button className="primary" onClick={onExperiment}><Play size={16}/>开始模拟</button></header>;
}

function DataEditor({ snapshot, onSaved, onClose, readOnly }: { snapshot: Snapshot | null; onSaved: () => void; onClose: () => void; readOnly: boolean }) {
  const d = snapshot?.data ?? emptyPayload;
  const [sourceLabel, setSourceLabel] = useState(snapshot?.provenance.sourceMode === 'persisted-observation' ? snapshot.provenance.sourceLabel : '手工核验经营快照');
  const [observedAt, setObservedAt] = useState(snapshot?.provenance.asOf ? snapshot.provenance.asOf.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [values, setValues] = useState<Record<string, string>>({
    engagementRate: d.content.engagementRate?.toString() ?? '', weeklyOpportunities: d.content.weeklyOpportunities?.toString() ?? '',
    roomEntryRate: d.live.roomEntryRate?.toString() ?? '', cartRate: d.live.cartRate?.toString() ?? '',
    conversionRate: d.commerce.conversionRate?.toString() ?? '', gmv: d.commerce.gmv?.toString() ?? '', newCustomers: d.commerce.newCustomers?.toString() ?? '',
    budget: d.ads.budget?.toString() ?? '', roi: d.ads.roi?.toString() ?? '', cpa: d.ads.cpa?.toString() ?? '', notes: d.notes ?? '',
  });
  const [status, setStatus] = useState('');
  const set = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); if (readOnly) { setStatus('当前数据源为只读。获得写入权限后才能修改。'); return; } setStatus('保存中…');
    const payload: Payload = {
      content: { engagementRate: numberValue(values.engagementRate), weeklyOpportunities: numberValue(values.weeklyOpportunities) },
      live: { roomEntryRate: numberValue(values.roomEntryRate), cartRate: numberValue(values.cartRate) },
      commerce: { conversionRate: numberValue(values.conversionRate), gmv: numberValue(values.gmv), newCustomers: numberValue(values.newCustomers) },
      ads: { budget: numberValue(values.budget), roi: numberValue(values.roi), cpa: numberValue(values.cpa) }, notes: values.notes,
    };
    try {
      const response = await fetch('/api/business-world/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceLabel, sourceType: 'manual-entry', observedAt: new Date(observedAt).toISOString(), payload }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Save failed');
      setStatus('经营快照已保存'); await onSaved();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Save failed'); }
  }
  const fields: Array<[string, string, string]> = [['engagementRate','内容互动率','%'],['weeklyOpportunities','本周内容机会','条'],['roomEntryRate','直播进房率','%'],['cartRate','直播加购率','%'],['conversionRate','商品转化率','%'],['gmv','GMV','元'],['newCustomers','新客数','人'],['budget','投放预算','元'],['roi','ROI',''],['cpa','CPA','元']];
  return <div className="editor-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><form className="data-editor" role="dialog" aria-modal="true" aria-labelledby="data-source-title" onSubmit={submit}><div className="editor-head"><div><b id="data-source-title">{readOnly ? '经营数据源' : '连接 Business World 数据'}</b><span>{readOnly ? '当前来源为只读；暂未提供的指标会保持为空。' : '保存后将更新当前经营快照。'}</span></div><button type="button" aria-label="关闭数据源面板" onClick={onClose}>×</button></div><label>来源名称<input required disabled={readOnly} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)}/></label><label>观测时间<input required disabled={readOnly} type="datetime-local" value={observedAt} onChange={e => setObservedAt(e.target.value)}/></label><div className="field-grid">{fields.map(([key,label,unit]) => <label key={key}>{label}<div className="unit-input"><input type="number" step="any" disabled={readOnly} value={values[key]} onChange={e => set(key,e.target.value)}/><span>{unit}</span></div></label>)}</div><label>来源说明 / 备注<textarea disabled={readOnly} value={values.notes} onChange={e => set('notes',e.target.value)} placeholder="例如：来自 2026-09-17 店铺后台导出；文件已由运营核验。"/></label><div className="editor-actions"><span role="status" aria-live="polite">{status}</span><button className="primary" type="submit" disabled={readOnly}><Save size={16}/>{readOnly ? '只读来源' : '保存真实快照'}</button></div></form></div>;
}

export default function App() {
  const [active, setActive] = useState<NavId>('overview');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const response = await fetch('/api/business-world/state', { cache: 'no-store' }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Failed to load'); setSnapshot(body); }
    catch (err) { setSnapshot(null); setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("screen") as NavId | null;
    if (requested && nav.some(([id]) => id === requested)) setActive(requested);
    const requestedSearch = params.get("search");
    if (requestedSearch) setSearch(requestedSearch);
    if (params.get("source") === "1") setEditing(true);
  }, []);

  const matches = useMemo(() => search.trim() ? nav.filter(([,label]) => label.toLowerCase().includes(search.trim().toLowerCase())) : [], [search]);
  const goTo = useCallback((id: NavId) => {
    setActive(id);
    setSearch('');
    const url = new URL(window.location.href);
    if (id === 'overview') url.searchParams.delete('screen');
    else url.searchParams.set('screen', id);
    window.history.replaceState(null, '', url);
  }, []);

  const data = snapshot?.data ?? null;
  const view =
    active === 'overview' ? <OverviewRestored data={data}/> :
    active === 'persona' ? <PersonaRestored/> :
    active === 'world' ? <WorldRestored data={data}/> :
    active === 'content' ? <ContentRestored data={data}/> :
    active === 'live' ? <LiveRestored data={data}/> :
    active === 'growth' ? <GrowthRestored data={data}/> :
    active === 'product' ? <ProductRestored data={data}/> :
    active === 'experiment' ? <ExperimentRestored snapshot={snapshot}/> :
    <ReportRestored snapshot={snapshot}/>;

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">↗</div><div><b>Business<br/>World Agent</b><small>经营决策台</small></div></div><nav>{nav.map(([id,label,Icon]) => <button key={id} className={active===id?'active':''} aria-current={active===id?'page':undefined} onClick={() => goTo(id)}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-promo">来源清晰<br/>指标可追溯<small>经营数据与模拟结果分层呈现</small><div className="diaper-box">BW</div></div></aside><section className="workspace"><div className="topbar"><div className="search real-search"><Search size={16}/><input aria-label="搜索功能" aria-expanded={matches.length>0} aria-controls="feature-search-results" placeholder="搜索功能..." value={search} onChange={e => setSearch(e.target.value)}/>{matches.length>0 && <div id="feature-search-results" role="listbox" className="search-results">{matches.map(([id,label]) => <button key={id} role="option" onClick={() => goTo(id)}>{label}</button>)}</div>}</div><button className="date" onClick={() => void load()}><RefreshCw size={13}/>刷新</button><button className="team" onClick={() => setEditing(true)}><Database size={13}/>数据源</button></div><div className="canvas"><Header title={nav.find(([id]) => id === active)?.[1] ?? 'Business World'} subtitle="经营数据、策略建议和模拟结果分层呈现。" onExperiment={() => goTo('experiment')}/><SourceBanner snapshot={snapshot} onEdit={() => setEditing(true)}/>{loading ? <section className="panel empty-panel">正在读取经营数据…</section> : error ? <section className="panel empty-panel"><h3>数据暂时不可用</h3><p>{error}</p><button className="primary" onClick={() => void load()}>重试</button></section> : view}</div></section>{editing && <DataEditor snapshot={snapshot} onSaved={load} onClose={() => setEditing(false)} readOnly={!snapshot?.provenance.writable}/>}</main>;
}
