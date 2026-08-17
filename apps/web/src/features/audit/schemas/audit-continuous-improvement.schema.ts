export function validateImprovementOpportunity(input: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(input.opportunityTitle ?? input.opportunity_title ?? '').trim()) errors.push('Opportunity title is required.');
  if (!String(input.opportunityType ?? input.opportunity_type ?? '').trim()) errors.push('Opportunity type is required.');
  if (!String(input.manualCreationReason ?? input.manual_creation_reason ?? input.reason ?? '').trim() && !input.sourceTrendRunId && !input.source_trend_run_id) errors.push('Manual opportunity creation requires a source reason.');
  return errors;
}
