export function validateAssessmentAssignment(values: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(values.workerId ?? '').trim()) errors.push('Worker is required.');
  if (!String(values.assessmentId ?? '').trim()) errors.push('Assessment is required.');
  return errors;
}
