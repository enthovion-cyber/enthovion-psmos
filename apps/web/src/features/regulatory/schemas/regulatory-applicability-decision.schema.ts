export function validateRegulatoryApplicabilityDecision(values: Record<string, unknown>) {
  const missing = [];
  const decision = String(values.decision ?? '');
  if (!decision) missing.push('decision');
  if (decision !== 'Not Assessed' && !String(values.rationale ?? '').trim()) missing.push('rationale');
  if (decision === 'Partially Applicable' && !String(values.includedScope ?? '').trim()) missing.push('includedScope');
  if (decision === 'Partially Applicable' && !String(values.excludedScope ?? '').trim()) missing.push('excludedScope');
  return missing;
}
