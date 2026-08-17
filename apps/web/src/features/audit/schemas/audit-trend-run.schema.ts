export function validateAuditTrendRun(input: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(input.trendTitle ?? input.trend_title ?? '').trim()) errors.push('Trend title is required.');
  if (!String(input.trendType ?? input.trend_type ?? '').trim()) errors.push('Trend type is required.');
  if (!String(input.timePeriodStart ?? input.time_period_start ?? '').trim()) errors.push('Time period start is required.');
  if (!String(input.timePeriodEnd ?? input.time_period_end ?? '').trim()) errors.push('Time period end is required.');
  return errors;
}
