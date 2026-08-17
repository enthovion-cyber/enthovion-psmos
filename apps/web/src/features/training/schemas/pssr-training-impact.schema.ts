export function validatePssrTrainingImpact(values: Record<string, any>) {
  const errors: string[] = [];
  if (values.trainingRequired === undefined && values.training_required === undefined) errors.push('Training required decision');
  if ((values.trainingRequired ?? values.training_required) && !String(values.trainingRequiredReason ?? values.training_required_reason ?? '').trim()) errors.push('Impact basis');
  return errors;
}

