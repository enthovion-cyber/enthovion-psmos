export function validateMocTrainingReadiness(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.requirementId ?? values.requirement_id ?? '').trim()) errors.push('Requirement');
  return errors;
}
