'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Box, ClipboardList, Database, FlaskConical, Home, Package, Play,
  Radio, RefreshCw, Save, Search, ShieldCheck, Sparkles, Users, Video,
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

function fmt(value: number | null | undefined, suffix = '') {
  return value == null ? '—' : `${value.toLocaleString('zh-CN')}${suffix}`;
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>;
}

function EmptyState({ title, onConnect }: { title: string; onConnect: () => void }) {
  return <section className="panel empty-panel">
    <Database size={30}/><h3>{title}</h3>
    <p>当前还没有可用的经营快照。连接数据源或录入经营数据后即可开始分析。</p>
    <button className="primary" onClick={onConnect}><Database size={16}/>连接 / 录入真实数据</button>
  </section>;
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

function Overview({ data, onConnect }: { data: Payload | null; onConnect: () => void }) {
  if (!data) return <EmptyState title="Business World 尚未连接真实经营快照" onConnect={onConnect}/>;
  return <>
    <section className="hero-panel"><div><div className="eyebrow">经营概览</div><h2>把关键经营数据汇总到同一个工作台</h2><p>数据来自已连接来源；暂未获得的指标会明确显示为空。</p></div><div className="hero-baby">经营快照<br/><small>来源清晰 · 指标可追溯</small></div></section>
    <section className="metrics-row"><Metric label="内容互动率" value={fmt(data.content.engagementRate, '%')} sub="已持久化观测"/><Metric label="直播加购率" value={fmt(data.live.cartRate, '%')} sub="已持久化观测"/><Metric label="商品转化率" value={fmt(data.commerce.conversionRate, '%')} sub="已持久化观测"/><Metric label="ROI" value={fmt(data.ads.roi)} sub="已持久化观测"/></section>
    <section className="panel truth-grid"><Truth title="内容" value={fmt(data.content.weeklyOpportunities)} detail="本周机会条目"/><Truth title="直播" value={fmt(data.live.roomEntryRate, '%')} detail="进房率"/><Truth title="交易" value={fmt(data.commerce.gmv, ' 元')} detail="GMV"/><Truth title="投放" value={fmt(data.ads.budget, ' 元')} detail="预算"/></section>
  </>;
}

function Truth({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="truth-card"><b>{title}</b><strong>{value}</strong><span>{detail}</span></div>;
}

function DataView({ title, description, metrics, data, onConnect }: { title: string; description: string; metrics: Array<[string, string]>; data: Payload | null; onConnect: () => void }) {
  if (!data) return <EmptyState title={`${title}没有可验证数据`} onConnect={onConnect}/>;
  return <section className="panel data-surface"><div className="section-title"><span>{title}</span><small>已记录数据</small></div><p>{description}</p><div className="data-grid">{metrics.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></section>;
}

function PersonaView({ data, onConnect }: { data: Payload | null; onConnect: () => void }) {
  return <><section className="panel data-surface"><div className="section-title"><span>Persona Studio</span><small>策略模板 ≠ 观测事实</small></div><p>此前四个“人群画像”是硬编码模板，不能冒充真实消费者分群。现在只有在接入可验证分群数据后才会展示人口规模、占比和行为结论。</p></section>{!data && <EmptyState title="尚未接入消费者分群数据" onConnect={onConnect}/>}<section className="panel template-note"><b>可保留的产品意图</b><p>新手家庭、复购家庭、长辈照护、内容分享者可作为研究假设，但必须由真实行为数据验证后才进入 Persona 指标。</p></section></>;
}

function WorldView({ data, onConnect }: { data: Payload | null; onConnect: () => void }) {
  return <DataView title="World Builder 真实基线" description="World Builder 只使用当前持久化快照作为 observation layer；假设与观测分开。" data={data} onConnect={onConnect} metrics={data ? [['内容互动率', fmt(data.content.engagementRate, '%')], ['直播进房率', fmt(data.live.roomEntryRate, '%')], ['交易转化率', fmt(data.commerce.conversionRate, '%')], ['投放 ROI', fmt(data.ads.roi)]] : []}/>;
}

function ReportView({ snapshot, onConnect }: { snapshot: Snapshot | null; onConnect: () => void }) {
  if (!snapshot?.data) return <EmptyState title="没有可生成证据报告的数据" onConnect={onConnect}/>;
  return <section className="panel report"><div className="section-title"><span>经营报告</span><small>可追溯</small></div><dl><div><dt>数据来源</dt><dd>{snapshot.provenance.sourceLabel}</dd></div><div><dt>服务</dt><dd>{snapshot.provenance.provider}</dd></div><div><dt>观测时间</dt><dd>{snapshot.provenance.asOf}</dd></div><div><dt>存储位置</dt><dd>{snapshot.provenance.storage}</dd></div><div><dt>最后更新</dt><dd>{snapshot.provenance.updatedAt}</dd></div></dl><pre>{JSON.stringify(snapshot.data, null, 2)}</pre></section>;
}

function ExperimentView({ snapshot }: { snapshot: Snapshot | null }) {
  const [prompt, setPrompt] = useState('评估当前投放效率提升 10% 的方向性影响');
  const [changePercent, setChangePercent] = useState('10');
  const [lever, setLever] = useState('ad_efficiency');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState('');
  async function run() {
    setStatus('运行中…'); setResult(null);
    try {
      const response = await fetch('/api/business-world/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, lever, changePercent: Number(changePercent) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Scenario failed');
      setResult(body); setStatus('已持久化本次 Scenario run');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Scenario failed'); }
  }
  return <section className="panel experiment"><div className="section-title"><span>模拟实验</span><small>推演结果 · 非实际发生</small></div><p>以当前经营快照为基线进行情景推演。结果用于比较方案，不代表市场实际已经发生。</p><textarea value={prompt} onChange={e => setPrompt(e.target.value)}/><div className="experiment-controls"><select value={lever} onChange={e => setLever(e.target.value)}><option value="ad_efficiency">投放效率</option><option value="content_engagement">内容互动</option><option value="live_watch_time">直播观看</option><option value="checkout_conversion">交易转化</option><option value="repeat_purchase">复购</option></select><input type="number" value={changePercent} min={-80} max={200} onChange={e => setChangePercent(e.target.value)}/><button className="primary" onClick={run} disabled={!snapshot?.data}><Play size={16}/>运行并保存</button></div>{!snapshot?.data && <p className="warning">请先连接经营数据，再运行情景模拟。</p>}{status && <p className="status-line">{status}</p>}{result && <pre>{JSON.stringify(result, null, 2)}</pre>}</section>;
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
  const data = snapshot?.data ?? null;
  const common = { data, onConnect: () => setEditing(true) };
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

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">↗</div><div><b>Business<br/>World Agent</b><small>经营决策台</small></div></div><nav>{nav.map(([id,label,Icon]) => <button key={id} className={active===id?'active':''} onClick={() => { setActive(id); setSearch(''); }}><Icon size={18}/><span>{label}</span></button>)}</nav><div className="sidebar-promo">来源清晰<br/>指标可追溯<small>经营数据与模拟结果分层呈现</small><div className="diaper-box">BW</div></div></aside><section className="workspace"><div className="topbar"><div className="search real-search"><Search size={16}/><input aria-label="搜索功能" aria-expanded={matches.length>0} aria-controls="feature-search-results" placeholder="搜索功能..." value={search} onChange={e => setSearch(e.target.value)}/>{matches.length>0 && <div id="feature-search-results" role="listbox" className="search-results">{matches.map(([id,label]) => <button key={id} onClick={() => { setActive(id); setSearch(''); }}>{label}</button>)}</div>}</div><button className="date" onClick={() => void load()}><RefreshCw size={13}/>刷新</button><button className="team" onClick={() => setEditing(true)}><Database size={13}/>数据源</button></div><div className="canvas"><Header title={nav.find(([id]) => id === active)?.[1] ?? 'Business World'} subtitle="经营数据、策略建议和模拟结果分层呈现。" onExperiment={() => setActive('experiment')}/><SourceBanner snapshot={snapshot} onEdit={() => setEditing(true)}/>{loading ? <section className="panel empty-panel">正在读取经营数据…</section> : error ? <section className="panel empty-panel"><h3>数据暂时不可用</h3><p>{error}</p><button className="primary" onClick={() => void load()}>重试</button></section> : view}</div></section>{editing && <DataEditor snapshot={snapshot} onSaved={load} onClose={() => setEditing(false)} readOnly={!snapshot?.provenance.writable}/>}</main>;
}
