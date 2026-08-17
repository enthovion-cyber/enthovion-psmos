export const impairmentRequiredFields = ['safeguardType', 'safeguardId', 'impairmentType', 'reason', 'riskLevel', 'startAt', 'maxDurationValue', 'maxDurationUnit'] as const;

export function validateImpairmentInput(input: Record<string, unknown>) {
  const missing = impairmentRequiredFields.filter((field) => !input[field]);
  const risk = String(input.riskLevel ?? '');
  if (['High', 'Critical'].includes(risk) && !input.temporaryMitigationSummary && !input.mitigationMeasures) missing.push('temporaryMitigationSummary' as any);
  return missing.map((field) => String(field) === 'temporaryMitigationSummary' ? 'High/Critical risk requires temporary mitigation details.' : `${field} is required.`);
}
