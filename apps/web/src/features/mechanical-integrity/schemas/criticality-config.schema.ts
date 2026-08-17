export function validateCriticalityConfig(input: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(input.configName ?? input.config_name ?? '').trim()) errors.push('Configuration name is required.');
  return errors;
}
