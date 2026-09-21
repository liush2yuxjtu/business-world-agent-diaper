import { z } from 'zod';
import type { BusinessSnapshot } from '@/app/_components/business-world-restored';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
const title = z.string().trim().min(1).max(120);
const body = z.string().trim().min(1).max(12000);
const channel = z.string().trim().min(1).max(80);
export const createDraftInput = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('brief'), topicTitle: z.string().min(1).max(200) }),
  z.strictObject({ kind: z.literal('plan'), briefId: z.string().uuid(), revision: z.number().int().min(1), scheduledFor: date, channel }),
]);
export const editDraftInput = z.strictObject({ id: z.string().uuid(), revision: z.number().int().min(1), title, body, scheduledFor: date.optional(), channel: channel.optional() });
export type ContentDraft = {
  id: string; kind: 'brief' | 'plan'; title: string; body: string; revision: number; createdAt: string;
  source: { topicTitle: string; persona: string; dataMode: 'simulated' | 'observed'; sourceLabel: string; asOf: string | null };
  basedOnBrief?: { id: string; revision: number };
  scheduledFor?: string; channel?: string;
};
export function composeContentBrief(snapshot: BusinessSnapshot, topicTitle: string, id: string, createdAt: string): ContentDraft {
  const data = snapshot.data;
  const topic = data?.content.topTopics.find(item => item.title === topicTitle);
  if (!data || !topic) throw new Error('CONTENT_SOURCE_MISSING');
  return {
    id, kind: 'brief', title: `内容 brief：${topic.title}`.slice(0, 120), revision: 1, createdAt,
    source: { topicTitle: topic.title, persona: topic.persona, dataMode: data.meta.dataMode, sourceLabel: snapshot.provenance.sourceLabel, asOf: snapshot.provenance.asOf },
    body: [data.meta.dataMode === 'simulated' ? '合成数据演示；选题与人群是假设，需验证。' : '基于已保存的经营快照；发布前复核证据。',
      `选题：${topic.title}`, `目标人群：${topic.persona}`, '内容目标：围绕该人群的问题准备可核验的讲解。',
      '建议结构（当前数据集模板）：', ...data.content.scripts.map(item => `- ${item.name}：${item.format}，${item.durationSec} 秒`),
      '待补充：商品证据、素材来源、表达边界、行动引导。', '验收：人工核对事实、素材授权和合规表达后，再确认加入发布计划。',
      '此草稿由固定模板整理，可编辑；没有自动发布。'].join('\n'),
  };
}
export function composeContentPlan(brief: ContentDraft, input: { id: string; scheduledFor: string; channel: string }, createdAt: string): ContentDraft {
  if (brief.kind !== 'brief') throw new Error('CONTENT_INVALID');
  return { ...structuredClone(brief), ...input, kind: 'plan', revision: 1, createdAt, basedOnBrief: { id: brief.id, revision: brief.revision } };
}
