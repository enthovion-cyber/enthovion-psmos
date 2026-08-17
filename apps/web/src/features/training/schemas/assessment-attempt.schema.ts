export function validateAssessmentAnswer(values: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(values.questionId ?? '').trim()) errors.push('Question is required.');
  if (values.answer === undefined && !String(values.answerText ?? '').trim() && !String(values.evidenceDocumentId ?? '').trim()) errors.push('Answer or evidence is required.');
  return errors;
}
