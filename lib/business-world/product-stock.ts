export type StockProduct = { id: string; name: string; stockDays: number | null | undefined };

export function stockReview<T extends StockProduct>(products: T[], threshold: number) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 365) return null;
  const low: T[] = [];
  const unknown: T[] = [];
  for (const product of products) {
    const days = product.stockDays;
    if (days == null || !Number.isFinite(days) || days < 0) unknown.push(product);
    else if (days <= threshold) low.push(product);
  }
  return { low, unknown };
}
