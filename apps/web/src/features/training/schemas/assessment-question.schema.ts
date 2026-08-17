export function validateAssessmentQuestion(values: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(values.questionText ?? '').trim()) errors.push('Question text is required.');
  if (!String(values.questionType ?? '').trim()) errors.push('Question type is required.');
  if (Number(values.points ?? 0) <= 0) errors.push('Question points must be greater than zero.');
  return errors;
}
