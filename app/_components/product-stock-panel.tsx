'use client';

import { useState } from 'react';
import { stockReview } from '@/lib/business-world/product-stock';
import { entityHref } from '@/lib/business-world/entity-links';
import type { BusinessPayload } from './business-world-restored';

export function ProductStockPanel({ data, onSource }: { data: BusinessPayload | null; onSource?: () => void }) {
  const [threshold, setThreshold] = useState('7');
  const [group, setGroup] = useState<'low' | 'unknown'>('low');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const products = data?.commerce.products ?? [];
  const groups = threshold.trim() ? stockReview(products, Number(threshold)) : null;
  const rows = groups?.[group] ?? [];
  const selected = rows.find(product => product.id === selectedId);
  const changeGroup = (next: 'low' | 'unknown') => { setGroup(next); setSelectedId(null); };
  return <section className="panel product-stock-panel" aria-labelledby="product-stock-title">
    <div className="section-title"><h2 id="product-stock-title">库存与补货核查</h2><small>{data?.meta.dataMode === 'simulated' ? '合成演示数据' : data ? '当前快照' : '待连接数据'}</small></div>
    <p>按快照中的库存天数筛选需复核的商品。阈值只用于本页核查，不是供应商交期，也不代表已确认缺货。</p>
    <label className="stock-threshold">核查阈值（天）<input type="number" min="0" max="365" step="any" value={threshold} aria-invalid={!groups} aria-describedby="stock-threshold-help" onChange={event => { setThreshold(event.target.value); setSelectedId(null); }}/></label>
    <p id="stock-threshold-help">默认 7 天，可在 0–365 天内调整；筛选条件不会写入经营数据。</p>
    {!groups && <p role="alert">请输入 0–365 之间的有效天数；条件无效时不做库存风险判断。</p>}
    <div className="campaign-risk-options" role="group" aria-label="按库存核查项筛选">
      <button aria-pressed={group === 'low'} aria-controls="stock-review-results" onClick={() => changeGroup('low')}>达到核查阈值（{groups?.low.length ?? '—'}）</button>
      <button aria-pressed={group === 'unknown'} aria-controls="stock-review-results" onClick={() => changeGroup('unknown')}>库存数值待核查（{groups?.unknown.length ?? '—'}）</button>
    </div>
    <div id="stock-review-results" role="region" aria-label="库存核查商品">
      <p role="status">{groups ? `${group === 'low' ? `库存天数 ≤ ${Number(threshold)}` : '库存数值待核查'}：${rows.length} 件商品` : '筛选条件无效，未执行核查'}</p>
      {rows.length ? <ul>{rows.map(product => <li key={product.id}><button aria-pressed={selected?.id === product.id} aria-controls="stock-review-detail" onClick={() => setSelectedId(product.id)}>核查补货：{product.name}</button><span>{group === 'low' ? `${product.stockDays} 天` : '库存天数无有效依据'}</span></li>)}</ul> : groups && <p>{products.length ? '没有符合当前核查条件的商品；不代表库存风险已全部排除。' : '尚无商品数据，无法判断库存风险。'}</p>}
    </div>
    <div id="stock-review-detail" role="region" aria-label="补货核查详情" aria-live="polite">
      {selected ? <>
        <h3>补货核查：{selected.name}</h3>
        <dl className="detail-list"><div><dt>商品编号</dt><dd>{selected.id}</dd></div><div><dt>尺码</dt><dd>{selected.size}</dd></div><div><dt>快照库存天数</dt><dd>{group === 'low' ? `${selected.stockDays} 天` : '未提供有效数值'}</dd></div><div><dt>本次核查条件</dt><dd>{group === 'low' ? `库存天数不超过 ${Number(threshold)} 天` : '缺失、负数或非有限数值'}</dd></div><div><dt>来源版本</dt><dd>{data?.meta.datasetVersion || '未提供'}</dd></div><div><dt>数据边界</dt><dd>{data?.meta.dataMode === 'simulated' ? '合成演示，非实际库存' : '库存天数来自当前保存的快照'}</dd></div></dl>
        <h4>形成补货方案前需补齐</h4>
        <ul><li>可售库存、在途数量及已预留订单</li><li>同周期日均需求及库存天数的计算口径</li><li>采购交期、安全库存、最小起订量与整箱规格</li></ul>
        <p>以上依据尚未提供，暂不计算补货数量或预计售罄日期。完成核查后再由负责人决定采购；本页不会创建采购单或调整库存。</p>
        <div className="stock-detail-actions"><a href={entityHref('product', selected.id)}>查看商品完整指标</a>{onSource && <button onClick={onSource}>查看补货核查来源</button>}<button onClick={() => setSelectedId(null)}>关闭补货详情</button></div>
      </> : <p>选择一件核查商品，查看对应依据与补货信息缺口。</p>}
    </div>
  </section>;
}
