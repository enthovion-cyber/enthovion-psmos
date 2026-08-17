export const regulatoryAuthorityRequiredFields = ['authorityName', 'authorityType'];
export function validateRegulatoryAuthority(values: Record<string, unknown>) {
  return regulatoryAuthorityRequiredFields.filter((field) => !String(values[field] ?? '').trim());
}
