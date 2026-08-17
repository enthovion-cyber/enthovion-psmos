export const regulatoryApplicabilityProfileRequiredFields = ['profileName', 'profileType'];
export function validateRegulatoryApplicabilityProfile(values: Record<string, unknown>) {
  return regulatoryApplicabilityProfileRequiredFields.filter((field) => !String(values[field] ?? '').trim());
}
