import { z } from 'zod';

const text = z.string().trim().min(1).max(1200);
export const productAssociationsSchema = z.object({
  source: text, asOf: z.string().datetime(), period: text, methodology: text,
  mode: z.enum(['simulated', 'observed']),
  sampleOrders: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  rows: z.array(z.object({
    id: z.string().trim().min(1).max(120), title: text,
    productIds: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
    jointOrders: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), hypothesis: text,
  })).max(100),
}).refine(value => new Set(value.rows.map(row => row.id)).size === value.rows.length && value.rows.every(row =>
  new Set(row.productIds).size === row.productIds.length && row.jointOrders <= value.sampleOrders),
{ message: '组合身份、商品成员或同单样本量无效' });
export type ProductAssociations = z.infer<typeof productAssociationsSchema>;
export function readProductAssociations(input: unknown, mode: string) {
  const parsed = productAssociationsSchema.safeParse(input);
  return parsed.success ? { ...parsed.data, mode: mode === 'simulated' ? 'simulated' as const : parsed.data.mode } : null;
}
export function associationProduct<T extends { id: string }>(products: T[], id: string): T | null {
  const matches = products.filter(product => product.id === id);
  return matches.length === 1 ? matches[0] : null;
}
