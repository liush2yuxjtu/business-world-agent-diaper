'use client';

import { productCategoryGroups, type CategorizedProduct } from '@/lib/business-world/product-category';

export function ProductCategoryFilter({ products, selected, onSelect }: {
  products: CategorizedProduct[];
  selected: string | null | undefined;
  onSelect: (category: string | null | undefined) => void;
}) {
  const groups = productCategoryGroups(products);
  if (!groups) return <p role="status">商品 GMV 包含无效数值，无法绘制分类图；商品列表仍可查看。</p>;
  const max = Math.max(0, ...groups.map(group => group.gmv));
  return <>
    <p className="caption">按来源提供的商品分类汇总 GMV，不从名称或概念图推断分类。图中只含当前 SKU；顶部指标保持整份快照口径。</p>
    {!products.length && <p>暂无商品记录。</p>}
    {groups.some(group => group.category === null) && <p role="note">部分商品未提供分类，单独列为“未注明分类”。</p>}
    <div className="product-category-chart" role="group" aria-label="按商品分类筛选 SKU">
      <button type="button" aria-pressed={selected === undefined} aria-controls="product-results" onClick={() => onSelect(undefined)}>全部分类（{products.length}）</button>
      {groups.map(group => <button type="button" key={JSON.stringify(group.category)} aria-pressed={selected === group.category} aria-controls="product-results" onClick={() => onSelect(group.category)} aria-label={`${group.category ?? '未注明分类'}：${group.count} 件商品，GMV ${group.gmv.toLocaleString('zh-CN')} 元`}>
        <span><b>{group.category ?? '未注明分类'}（{group.count}）</b><span>{group.gmv.toLocaleString('zh-CN')} 元</span></span>
        <span className="product-category-track" aria-hidden="true"><i style={{ width: `${max > 0 ? group.gmv / max * 100 : 0}%` }}/></span>
      </button>)}
    </div>
  </>;
}
