export function validateCancelSubscription(input: { reason?: string }) {
  const errors: string[] = [];
  if (!input.reason?.trim()) errors.push('Cancellation reason is required.');
  return errors;
}
