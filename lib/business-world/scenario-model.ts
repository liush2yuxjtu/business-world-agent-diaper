// Shared by the unsaved preview and the server-side persisted scenario.
export function scenarioMetrics(baselineRoi: number | null, baselineConversionRate: number | null, changePercent: number) {
  if (!Number.isFinite(changePercent) || changePercent < -80 || changePercent > 200) return null;
  const scale = (value: number | null) => value == null || !Number.isFinite(value) ? null : Number((value * (1 + changePercent / 100)).toFixed(2));
  return { baselineRoi, modeledRoi: scale(baselineRoi), baselineConversionRate, modeledConversionRate: scale(baselineConversionRate) };
}
