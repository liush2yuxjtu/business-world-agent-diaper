import { z } from 'zod';

export const liveQuestionsSchema = z.object({
  source: z.string().trim().min(1).max(300),
  asOf: z.string().datetime(),
  mode: z.enum(['simulated', 'observed']),
  methodology: z.string().trim().min(1).max(1200),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(120),
    sessionId: z.string().trim().min(1).max(120),
    at: z.string().datetime(),
    text: z.string().trim().min(1).max(2000),
    category: z.enum(['product', 'shipping', 'size', 'authenticity', 'other']),
  })).max(100),
}).refine(value => new Set(value.items.map(item => item.id)).size === value.items.length,
  { message: '问题标识不能重复' });

export type LiveQuestion = z.infer<typeof liveQuestionsSchema>['items'][number];
export const questionCategories = { product: '商品咨询', shipping: '发货物流', size: '尺码问题', authenticity: '正品保障', other: '其他问题' } as const;
export function readLiveQuestions(input: unknown, mode: string) {
  const result = liveQuestionsSchema.safeParse(input);
  return result.success ? { ...result.data, mode: mode === 'simulated' ? 'simulated' as const : result.data.mode } : null;
}

const reviewSteps: Record<LiveQuestion['category'], string> = {
  product: '核对该商品的材质、适用说明和检测依据；涉及皮肤不适时，不作医疗判断或无依据的效果承诺。',
  shipping: '核对订单状态、收货地区与店铺当前发货规则；无法确认前，不承诺具体发货或送达时间。',
  size: '核对当前商品尺码表、适用体重与库存，再请顾客按实际需求选择；不猜测尺码或库存。',
  authenticity: '核对店铺经营主体、品牌授权与可提供的商品凭证；凭证未确认前，不作正品保障承诺。',
  other: '确认问题对应的商品或订单，并向负责人员核实依据后再回复。',
};
export function questionSuggestion(question: LiveQuestion, kind: 'reply' | 'task') {
  const step = reviewSteps[question.category];
  return kind === 'reply'
    ? `收到您的问题，我们需要先核实相关信息，再向您提供准确说明。\n\n回复前核查（内部备注，不发送给顾客）：${step}`
    : `待办建议：核实${questionCategories[question.category]}\n原问题：${question.text}\n核查步骤：${step}\n完成条件：记录核实依据，人工审核回复内容后再决定发送。`;
}
