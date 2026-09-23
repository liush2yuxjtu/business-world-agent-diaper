import type { BusinessPayload } from '@/app/_components/business-world-restored';

// Resolve against the saved baseline, never accept a client-supplied entity label.
export function scenarioEntity(data: BusinessPayload | null, id: string) {
  if (!data || !id) return null;
  const candidates = [
    ...data.personas.map(p => ({ id: `persona:${p.id}`, label: p.title, lever: 'repeat_purchase' })),
    ...data.content.topTopics.map(p => ({ id: `topic:${p.title}`, label: p.title, lever: 'content_engagement' })),
    ...data.live.sessions.map(p => ({ id: `session:${p.id}`, label: p.title, lever: 'live_watch_time' })),
    ...data.ads.campaigns.map(p => ({ id: `campaign:${p.id}`, label: p.name, lever: 'ad_efficiency' })),
    ...data.commerce.products.map(p => ({ id: `product:${p.id}`, label: p.name, lever: 'checkout_conversion' })),
  ];
  return candidates.find(p => p.id === id) ?? null;
}

export const worldPresets = [
  { id: 'baseline', label: '基线', change: 0 },
  { id: 'growth', label: '增长', change: 10 },
  { id: 'downside', label: '下行', change: -10 },
] as const;
