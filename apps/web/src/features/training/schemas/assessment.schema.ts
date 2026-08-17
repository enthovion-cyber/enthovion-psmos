export function validateAssessment(values: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(values.assessmentTitle ?? '').trim()) errors.push('Assessment title is required.');
  if (!String(values.assessmentType ?? '').trim()) errors.push('Assessment type is required.');
  if (Number(values.passingScore ?? 0) > Number(values.maxScore ?? 100)) errors.push('Passing score cannot exceed max score.');
  return errors;
}
