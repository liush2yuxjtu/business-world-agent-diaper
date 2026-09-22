'use client';

import { useEffect, useRef, useState } from 'react';
import { associationProduct, readProductAssociations, type ProductAssociations } from '@/lib/business-world/product-associations';
import type { BusinessPayload } from './business-world-restored';

type BundleDraft = { id: number | string; productIds: string[]; hypothesis: string; association?: { source: ProductAssociations; row: ProductAssociations['rows'][number] } };

export function ProductBundleProposals({ data, onSource }: { data: BusinessPayload | null; onSource?: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [hypothesis, setHypothesis] = useState('');
  const [drafts, setDrafts] = useState<BundleDraft[]>([]);
  const [openId, setOpenId] = useState<number | string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const sequence = useRef(0);
  const products = data?.commerce.products ?? [];
  const associations = readProductAssociations(data?.commerce.associations, data?.meta.dataMode ?? '');
  const sourcedDrafts: BundleDraft[] = associations?.rows.map(row => ({ id: `association:${row.id}`, productIds: row.productIds, hypothesis: row.hypothesis, association: { source: associations, row } })) ?? [];
  const validSelected = selected.filter(id => associationProduct(products, id));
  const draft = drafts.find(item => item.id === openId) ?? sourcedDrafts.find(item => item.id === openId);
  const members = draft?.productIds.map(id => associationProduct(products, id));
  const missing = members?.some(item => !item) ?? false;
  useEffect(() => {
    if (draft && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [draft]);
  const close = () => { dialog.current?.close(); setOpenId(null); trigger.current?.focus(); };
  const canCreate = validSelected.length >= 2 && hypothesis.trim().length > 0;
  return <section className="panel bundle-proposals" aria-label="组合商品研究提案">
    <h2>组合商品研究提案</h2>
    <p>{associations ? (associations.mode === 'simulated' ? '数据库中的关联购买为人工合成样本，非真实订单；用于体验从证据到组合研究提案的过程。' : '关联购买来自下方明确的订单样本；同单出现不代表因果关系或套装收益。') : '当前缺少有效的关联购买来源，不能证明哪些商品经常一起购买。'}也可自行选择目录商品，记录待验证的组合假设。</p>
    {associations && <><h3>关联购买依据</h3><p>{associations.source} · {associations.period} · 样本 {associations.sampleOrders.toLocaleString('zh-CN')} 单</p>
      <div className="table-scroll" role="region" tabIndex={0} aria-label="关联购买表格，支持横向滚动"><table><thead><tr><th scope="col">组合提案</th><th scope="col">同单数</th><th scope="col">样本内占比</th></tr></thead><tbody>{sourcedDrafts.map(item => <tr key={item.id}><td><button type="button" onClick={event => { trigger.current = event.currentTarget; setOpenId(item.id); }}>查看关联组合：{item.association!.row.title}</button></td><td>{item.association!.row.jointOrders}</td><td>{(item.association!.row.jointOrders / associations.sampleOrders * 100).toFixed(1)}%</td></tr>)}</tbody></table></div>
      <p>比例分母为同一来源的样本订单数；组合可能重叠，不求和，不等于购买概率或客单提升。</p></>}

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
      {draft && <><div className="section-title"><h2 id="bundle-proposal-title">{draft.association ? draft.association.row.title : `组合提案 ${draft.id}`}</h2><button type="button" onClick={close} aria-label="关闭组合提案">关闭</button></div>
        <p><b>{draft.association ? '来源关联的研究提案' : '人工研究草稿'} · 待核查 · 未执行</b></p><p>{draft.hypothesis}</p>
        {draft.association && <><dl className="detail-list"><div><dt>关联来源</dt><dd>{draft.association.source.source}</dd></div><div><dt>数据性质</dt><dd>{draft.association.source.mode === 'simulated' ? '人工合成订单样本，非真实交易' : '来源报告的订单样本'}</dd></div><div><dt>统计周期</dt><dd>{draft.association.source.period}</dd></div><div><dt>来源时间</dt><dd>{draft.association.source.asOf}</dd></div><div><dt>同单与分母</dt><dd>{draft.association.row.jointOrders} / {draft.association.source.sampleOrders} 单</dd></div><div><dt>关联口径</dt><dd>{draft.association.source.methodology}</dd></div></dl><p>没有提供可比的客单差额或因果实验，不能推导套装增收。</p></>}

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
