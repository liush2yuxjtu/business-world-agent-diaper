'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, History, LoaderCircle, Play, RotateCcw } from 'lucide-react';
import catalog from '@/lib/roadshow/catalog.json';
import { readHistory, readRun, saveScenario, type ScenarioRun } from '@/lib/roadshow/scenario-client';
import type { BusinessSnapshot } from '../business-world-restored';

type Scenario = (typeof catalog.scenarios)[number];
type AgentState = 'neutral' | 'thinking' | 'simulating' | 'recommendation' | 'alert';
export const formatMetric = (n: number | null | undefined, suffix = '') => n == null ? '—' : n.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) + suffix;

export function ScenarioRunner({snapshot, scenario, context = '', onStatus}: {snapshot: BusinessSnapshot | null; scenario: Scenario; context?: string; onStatus?: (state: AgentState) => void}) {
  const [change, setChange] = useState(String(scenario.change));
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<ScenarioRun | null>(null);
  const [history, setHistory] = useState<ScenarioRun[]>([]);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [reading, setReading] = useState(false);
  useEffect(() => {
    setChange(String(scenario.change));
    setPrompt(`${context ? context + '。' : ''}${scenario.name}：评估${scenario.leverName}变化 ${scenario.change}% 的方向性影响。`);
    setError('');
  }, [scenario.id, scenario.change, scenario.name, scenario.leverName, context]);
  useEffect(() => {
    let cancelled = false;
    readHistory().then(value => { if (!cancelled) setHistory(value); }).catch(() => { if (!cancelled) setHistoryError('暂时无法读取历史记录。'); });
    const id = new URL(window.location.href).searchParams.get('run');
    if (id) {
      setReading(true);
      readRun(id).then(value => { if (!cancelled) setRun(value); }).catch(() => { if (!cancelled) setError('链接中的情景记录无法读取。'); }).finally(() => { if (!cancelled) setReading(false); });
    }
    return () => { cancelled = true; };
  }, []);
  function remember(value: ScenarioRun) {
    setRun(value);
    const url = new URL(window.location.href);
    url.searchParams.set('run', value.id);
    window.history.replaceState(null, '', url);
  }
  async function reloadHistory() {
    setHistoryError('');
    try { setHistory(await readHistory()); } catch { setHistoryError('暂时无法读取历史记录，请重试。'); }
  }
  async function execute() {
    const amount = Number(change);
    if (!change.trim() || !Number.isFinite(amount) || amount < -80 || amount > 200 || prompt.trim().length < 3 || prompt.length > 1000) {
      setError('请填写 3–1000 字的假设，以及 -80 到 200 之间的变化百分比。'); return;
    }
    setBusy(true); setRun(null); setError(''); onStatus?.('simulating');
    try {
      const saved = await saveScenario({ prompt, lever: scenario.lever, changePercent: amount });
      remember(saved); onStatus?.('recommendation');
      await reloadHistory();
    } catch (e) { setError(e instanceof Error ? e.message : '运行失败，请重试。'); onStatus?.('alert'); }
    finally { setBusy(false); }
  }
  async function openHistory(id: string) {
    setReading(true); setError('');
    try { remember(await readRun(id)); } catch { setError('无法读取这条情景记录，请重试。'); }
    finally { setReading(false); }
  }
  const modeled = run?.result;
  const max = Math.max(1, modeled?.baselineRoi ?? snapshot?.data?.ads.roi ?? 0, modeled?.modeledRoi ?? 0);
  return <div className="wm-runner" id="scenario-runner" aria-busy={busy}>
    <div className="wm-run-form">
      <p className="wm-eyebrow">现场推演 / {scenario.name}</p>
      <h3>如果{scenario.leverName}改变，会怎样？</h3>
      <p className="wm-muted">沿用 Product Demo 的单变量线性模型。对 ROI 和转化率施加同一比例，属于方向性比较。</p>
      <label>业务假设<textarea aria-label="业务假设" value={prompt} maxLength={1000} disabled={busy} onChange={e => setPrompt(e.target.value)}/></label>
      <div className="wm-run-controls"><label>变化幅度（%）<input aria-label="变化幅度" type="number" min={-80} max={200} step="any" value={change} disabled={busy} onChange={e => setChange(e.target.value)}/></label><button className="wm-primary" onClick={execute} disabled={busy || reading || !snapshot?.data || !snapshot.provenance.writable}>{busy ? <LoaderCircle className="wm-spin" size={17}/> : <Play size={17}/>} {busy ? '运行并保存中…' : '运行并保存情景'}</button></div>
      {!snapshot?.data && <p className="wm-muted">读取经营数据后即可运行。</p>}
      {snapshot?.data && !snapshot.provenance.writable && <p className="wm-muted">当前数据源只读，无法保存情景。</p>}
      <p className="wm-small">这不会修改投放、订单或库存。结果不是市场预测或收益保证。</p>
    </div>
    <div className="wm-run-result">
      <div className="wm-section-head"><h3>基线与情景</h3><span className="wm-tag">{run ? '已保存的推演' : '当前快照'}</span></div>
      <div className="wm-comparison" aria-label="ROI 比较">
        {[{label:'基线 ROI',value:modeled?.baselineRoi ?? snapshot?.data?.ads.roi},{label:'情景 ROI',value:modeled?.modeledRoi}].map((v,i)=><div key={v.label}><b>{formatMetric(v.value)}</b><div className={i ? 'wm-bar modeled' : 'wm-bar'} style={{height: `${Math.max(2, ((v.value ?? 0) / max) * 110)}px`}}/><span>{v.label}</span></div>)}
      </div>
      <div className="wm-conversion"><span>交易转化率</span><b>{formatMetric(modeled?.baselineConversionRate ?? snapshot?.data?.commerce.conversionRate,'%')}</b><ArrowRight size={15}/><b>{formatMetric(modeled?.modeledConversionRate,'%')}</b></div>
      <div role="status" aria-live="polite" className={error ? 'wm-status error' : 'wm-status'}>
        {busy ? <><LoaderCircle size={18} className="wm-spin"/>正在读取基线、运行情景并保存…</> : reading ? '正在读回情景…' : error ? error : run ? <><CheckCircle2 size={18}/>数据库已保存并读回验证</> : '运行后显示情景结果与实际保存记录。'}
      </div>
      {run && <div className="wm-record" data-run-id={run.id}><p>{run.prompt}</p><span>{new Date(run.createdAt).toLocaleString('zh-CN')}</span><code>{run.id}</code><small>刷新页面可按此记录重新读取。</small></div>}
    </div>
    <div className="wm-history"><div className="wm-section-head"><h3><History size={17}/>情景记录</h3><button onClick={() => void reloadHistory()} disabled={busy}><RotateCcw size={14}/>刷新记录</button></div>
      {historyError && <p role="status" className="wm-muted">{historyError}</p>}
      {!history.length && !historyError && <p className="wm-muted">暂无可显示的记录。运行一次情景后会出现在这里。</p>}
      <div className="wm-history-list">{history.map(h=><button key={h.id} onClick={() => void openHistory(h.id)} disabled={busy || reading} aria-pressed={run?.id===h.id}><span>{h.prompt}</span><small>{new Date(h.createdAt).toLocaleString('zh-CN')}</small><ArrowRight size={14}/></button>)}</div>
    </div>
  </div>;
}
