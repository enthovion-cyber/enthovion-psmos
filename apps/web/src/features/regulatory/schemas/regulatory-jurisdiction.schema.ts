export function validateRegulatoryJurisdiction(values: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(values.jurisdiction_name ?? values.jurisdictionName ?? '').trim()) errors.push('Jurisdiction name is required.');
  if (!String(values.jurisdiction_level ?? values.jurisdictionLevel ?? '').trim()) errors.push('Jurisdiction level is required.');
  return errors;
}
