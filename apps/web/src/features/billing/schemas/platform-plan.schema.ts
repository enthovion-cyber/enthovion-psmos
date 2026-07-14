export function validatePlatformPlan(input: { name?: string; code?: string; plan_type?: string }) {
  const errors: string[] = [];
  if (!input.name) errors.push('Plan name is required.');
  if (!input.code) errors.push('Plan code is required.');
  if (!input.plan_type) errors.push('Plan type is required.');
  return errors;
}
