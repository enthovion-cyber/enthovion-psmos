export function validateChangePlan(input: { planId?: string; reason?: string }) {
  const errors: string[] = [];
  if (!input.planId) errors.push('Plan is required.');
  if (input.reason && input.reason.length > 500) errors.push('Reason must be 500 characters or fewer.');
  return errors;
}
