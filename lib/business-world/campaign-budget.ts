type Campaign = { channel: string; budget: number };

// Derive both the chart and table filter from campaigns, not an unrelated channelMix.
export function campaignBudgetGroups(campaigns: Campaign[]) {
  if (campaigns.some(c => !Number.isFinite(c.budget) || c.budget < 0)) return null;
  const groups = new Map<string, { channel: string; budget: number; count: number }>();
  for (const c of campaigns) {
    const group = groups.get(c.channel) ?? { channel: c.channel, budget: 0, count: 0 };
    group.budget += c.budget;
    group.count++;
    groups.set(c.channel, group);
  }
  const total = [...groups.values()].reduce((sum, g) => sum + g.budget, 0);
  if (!Number.isFinite(total)) return null;
  return { total, groups: [...groups.values()].map(g => ({ ...g, share: total > 0 ? g.budget / total : 0 })) };
}

export function budgetSlicePath(start: number, share: number) {
  if (share <= 0) return '';
  const point = (turn: number) => [100 + 86 * Math.cos(turn * Math.PI * 2 - Math.PI / 2), 100 + 86 * Math.sin(turn * Math.PI * 2 - Math.PI / 2)];
  const [x, y] = point(start);
  if (share >= 1) return `M100 14 A86 86 0 1 1 100 186 A86 86 0 1 1 100 14 Z`;
  const [endX, endY] = point(start + share);
  return `M100 100 L${x} ${y} A86 86 0 ${share > .5 ? 1 : 0} 1 ${endX} ${endY} Z`;
}
