export type CampaignRiskInput = { id: string; name: string; channel: string; budget: number | null; spend: number | null };
export type CampaignRiskKind = 'budget-difference' | 'invalid-values';

export function campaignRiskGroups<T extends CampaignRiskInput>(campaigns: T[]) {
  const difference: Array<{ campaign: T; excess: number; percent: number | null }> = [];
  const invalid: Array<{ campaign: T }> = [];
  for (const campaign of campaigns) {
    const { budget, spend } = campaign;
    if (budget === null || spend === null || !Number.isFinite(budget) || !Number.isFinite(spend) || budget < 0 || spend < 0) {
      invalid.push({ campaign });
    } else if (spend > budget) {
      const percent = budget > 0 ? (spend - budget) / budget * 100 : null;
      difference.push({ campaign, excess: spend - budget, percent: percent !== null && Number.isFinite(percent) ? percent : null });
    }
  }
  return { difference, invalid };
}
