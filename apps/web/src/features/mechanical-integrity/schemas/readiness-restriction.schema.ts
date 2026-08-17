export function validateReadinessRestriction(values: Record<string, any>) {
  const missing: string[] = [];
  if (!values.restrictionType && !values.restriction_type) missing.push('Restriction type');
  if (!values.restrictionDescription && !values.restriction_description) missing.push('Restriction description');
  if (!values.expiryDate && !values.expiry_date) missing.push('Expiry date');
  return missing;
}
