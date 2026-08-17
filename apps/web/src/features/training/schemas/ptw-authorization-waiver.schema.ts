export function validatePtwAuthorizationWaiver(input: Record<string, any>) {
  const errors: string[] = [];
  if (!String(input.reason ?? '').trim()) errors.push('Waiver reason is required.');
  if (!String(input.expiryDate ?? input.expiry_date ?? '').trim()) errors.push('Waiver expiry date is required.');
  return errors;
}
