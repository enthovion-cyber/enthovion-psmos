import type { CriticalityAssessmentInput } from '../types/criticality-assessment.types';

export function validateCriticalityAssessment(input: Partial<CriticalityAssessmentInput>) {
  const errors: string[] = [];
  if (!input.equipmentId) errors.push('Equipment is required.');
  if (!input.assessmentReason?.trim()) errors.push('Assessment reason is required.');
  if (input.safetyCritical && !input.safetyCriticalReason?.trim()) errors.push('Safety-critical reason is required.');
  if (input.psmCritical && !input.psmCriticalReason?.trim()) errors.push('PSM-critical reason is recommended.');
  return errors;
}
