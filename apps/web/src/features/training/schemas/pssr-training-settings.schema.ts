export function validatePssrTrainingSettings(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.defaultDueDays ?? values.default_due_days ?? '').trim()) errors.push('Default due days');
  return errors;
}

