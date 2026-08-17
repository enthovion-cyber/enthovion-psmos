export const regulatoryApplicabilityAssessmentRequiredFields = ['regulatoryItemId'];
export function validateRegulatoryApplicabilityAssessment(values: Record<string, unknown>) {
  return regulatoryApplicabilityAssessmentRequiredFields.filter((field) => !String(values[field] ?? '').trim());
}
