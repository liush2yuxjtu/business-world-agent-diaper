'use client';

import { useEffect, useRef, useState } from 'react';
import type { BusinessPayload } from './business-world-restored';

type BundleDraft = { id: number; productIds: string[]; hypothesis: string };

export function ProductBundleProposals({ data, onSource }: { data: BusinessPayload | null; onSource?: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [hypothesis, setHypothesis] = useState('');
  const [drafts, setDrafts] = useState<BundleDraft[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const sequence = useRef(0);
  const products = data?.commerce.products ?? [];
  const validSelected = selected.filter(id => products.some(p => p.id === id));
  const draft = drafts.find(item => item.id === openId);
  const members = draft?.productIds.map(id => products.find(p => p.id === id));
  const missing = members?.some(item => !item) ?? false;
  useEffect(() => {
    if (draft && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [draft]);
  const close = () => { dialog.current?.close(); setOpenId(null); trigger.current?.focus(); };
  const canCreate = validSelected.length >= 2 && hypothesis.trim().length > 0;
  return <section className="panel bundle-proposals" aria-label="组合商品研究提案">
    <h2>组合商品研究提案</h2>
    <p>当前未接入关联购买订单，不能证明哪些商品经常一起购买。可自行选择目录商品，记录待验证的组合假设。</p>
    <p className="caption">草稿仅保留在本页，离开或刷新后清除。不会修改价格、库存、商品上下架，也不会发给外部平台或 Agent 执行。</p>
    <form onSubmit={event => {
      event.preventDefault();
      if (!canCreate) return;
      const nextDraft = { id: ++sequence.current, productIds: validSelected.slice(), hypothesis: hypothesis.trim() };
      setDrafts(items => [...items, nextDraft]);
      setSelected([]); setHypothesis('');
    }}>
      <fieldset><legend>选择至少两件商品</legend>{products.map(product => <label className="bundle-product-choice" key={product.id}><input type="checkbox" checked={validSelected.includes(product.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids.filter(id => id !== product.id), product.id] : ids.filter(id => id !== product.id))}/><span>{product.name}<small>{product.size} · 当前单价 {product.price.toLocaleString('zh-CN')} 元</small></span></label>)}</fieldset>
      {!products.length && <p>暂无可选商品，接入商品目录后才能创建组合假设。</p>}
      <label className="bundle-hypothesis">组合假设<textarea value={hypothesis} maxLength={1000} onChange={event => setHypothesis(event.target.value)} placeholder="说明适用人群、使用场景及需要验证的问题" required/></label>
      <p role="status">已选择 {validSelected.length} 件商品；{canCreate ? '可创建本页草稿。' : '至少选择两件商品并填写组合假设。'}</p>
      <button className="primary" type="submit" disabled={!canCreate}>创建组合草稿</button>
    </form>
    <div className="table-scroll" role="region" tabIndex={0} aria-label="组合提案表格，支持横向滚动"><table aria-label="组合提案列表"><thead><tr><th scope="col">组合</th><th scope="col">研究假设</th><th scope="col">状态</th></tr></thead><tbody>{drafts.map(item => <tr key={item.id}><td><button type="button" onClick={event => { trigger.current = event.currentTarget; setOpenId(item.id); }}>查看组合提案 {item.id}</button></td><td>{item.hypothesis}</td><td>待核查 · 未执行</td></tr>)}</tbody></table></div>
    {!drafts.length && <p>尚无组合提案。</p>}
    <dialog ref={dialog} className="campaign-review-dialog" aria-labelledby="bundle-proposal-title" onCancel={event => { event.preventDefault(); close(); }}>
      {draft && <><div className="section-title"><h2 id="bundle-proposal-title">组合提案 {draft.id}</h2><button type="button" onClick={close} aria-label="关闭组合提案">关闭</button></div>
        <p><b>人工研究草稿 · 待核查 · 未执行</b></p><p>{draft.hypothesis}</p>
        <ul>{draft.productIds.map((id, index) => <li key={id}>{members?.[index] ? `${members[index]!.name} · ${members[index]!.size} · 当前单价 ${members[index]!.price.toLocaleString('zh-CN')} 元` : `目录记录已不可用（${id}）`}</li>)}</ul>
        {missing ? <p role="alert">部分商品已不在当前快照中，需重新核对，不能沿用旧价格或库存。</p> : <p>各一件的当前目录价合计：{members?.reduce((sum, item) => sum + (item?.price ?? 0), 0).toLocaleString('zh-CN')} 元。这不是套装售价、优惠承诺或销量预测。</p>}
        <p>来源版本：{data?.meta.datasetVersion || '未提供'}；{data?.meta.dataMode === 'simulated' ? '合成演示目录，非真实在售商品。' : '当前经营快照，须复核商品与价格口径。'}</p>
        <h3>执行前需要的证据</h3><ul><li>同一订单中的关联购买及样本量。</li><li>尺码、适用人群、库存和履约兼容性。</li><li>成本、毛利、退款及可采用的优惠规则。</li><li>拟执行的平台、商品、售价及明确的人类批准。</li></ul>
        <p>尚未连接套装执行渠道；创建或查看此草稿不代表批准任何外部写入。</p>
        <button type="button" onClick={() => { close(); onSource?.(); }}>查看来源详情</button>
      </>}
    </dialog>
  </section>;
}
