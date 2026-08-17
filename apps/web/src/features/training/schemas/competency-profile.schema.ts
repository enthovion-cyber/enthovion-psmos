export const competencyProfileRequiredFields = ['profileName', 'profileCode', 'profileType', 'version'];
export function validateCompetencyProfile(value: Record<string, any>) {
  const missing = competencyProfileRequiredFields.filter((key) => !value[key]);
  if (value.profileType !== 'Custom' && !value.jobRole) missing.push('jobRole');
  if (value.safetyCritical && !value.ownerUserId) missing.push('ownerUserId');
  return missing;
}
