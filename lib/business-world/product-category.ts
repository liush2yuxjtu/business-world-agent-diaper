export type CategorizedProduct = { id: string; category?: string | null; gmv: number };
export const productCategory = (product: CategorizedProduct) => product.category?.trim() || null;

export function productCategoryGroups(products: CategorizedProduct[]) {
  const groups = new Map<string | null, { category: string | null; count: number; gmv: number }>();
  for (const product of products) {
    if (!Number.isFinite(product.gmv) || product.gmv < 0) return null;
    const category = productCategory(product);
    const group = groups.get(category) ?? { category, count: 0, gmv: 0 };
    group.count += 1;
    group.gmv += product.gmv;
    if (!Number.isFinite(group.gmv)) return null;
    groups.set(category, group);
  }
  return [...groups.values()];
}
