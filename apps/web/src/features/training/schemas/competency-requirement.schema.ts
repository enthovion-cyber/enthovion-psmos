export function validateCompetencyRequirement(value: Record<string, any>) {
  const missing = ['competencyTitle', 'competencyCategory', 'requiredLevel'].filter((key) => !value[key]);
  if (value.mandatory && value.evidenceRequired === false) missing.push('evidenceRule');
  if (value.safetyCritical && !value.verificationRequired) missing.push('verificationRequired');
  if (value.recurring && !value.renewalIntervalDays) missing.push('renewalIntervalDays');
  return missing;
}
