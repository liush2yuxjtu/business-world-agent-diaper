'use client';

import { useEffect, useState } from 'react';
import { readHistory, readRun, type ScenarioRun } from '@/lib/business-world/scenario-client';

export function ScenarioHistory({ activeId, refreshKey, onSelect, disabled, onReading }: {
  activeId?: string;
  disabled: boolean;
  onReading: (reading: boolean) => void;
  refreshKey: number;
  onSelect: (run: ScenarioRun) => void;
}) {
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    readHistory().then(value => { if (!cancelled) setRuns(value); })
      .catch(() => { if (!cancelled) setError('暂时无法读取情景记录，请重试。'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey, retry]);

  async function select(id: string) {
    setSelectedId(id); setError(''); onReading(true);
    try { onSelect(await readRun(id)); }
    catch { setError('无法读取所选情景，请刷新记录后重试。'); }
    finally { setSelectedId(null); onReading(false); }
  }

  return <section className="panel scenario-history" aria-busy={loading || selectedId !== null}>
    <div className="section-title"><h2>已保存的情景</h2><button onClick={() => setRetry(n => n + 1)} disabled={disabled || loading || selectedId !== null}>刷新记录</button></div>
    <p>选择一条记录，查看当时的假设、基线和推演结果。记录来自共享演示空间。</p>
    {loading ? <p role="status">正在读取情景记录…</p> : error ? <p role="status">{error}</p> : runs.length === 0 ? <p>暂无已保存情景。运行实验后可以在这里重新查看。</p> : null}
    {!loading && runs.map(run => <button className="action-row" key={run.id} onClick={() => void select(run.id)} disabled={disabled || selectedId !== null} aria-pressed={activeId === run.id}>
      <span><b>{run.prompt}</b><small>{new Date(run.createdAt).toLocaleString('zh-CN')} · 变化 {run.changePercent}%</small></span>
      <span>{selectedId === run.id ? '读取中…' : activeId === run.id ? '已选中' : '查看结果'}</span>
    </button>)}
  </section>;
}
