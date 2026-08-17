export const regulatoryApplicabilityGapRequiredFields = ['gapType', 'gapTitle'];
export function validateRegulatoryApplicabilityGap(values: Record<string, unknown>) {
  return regulatoryApplicabilityGapRequiredFields.filter((field) => !String(values[field] ?? '').trim());
}
