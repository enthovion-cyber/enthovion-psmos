export function validateSopAckWaiver(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.waiverReason ?? values.reason ?? '').trim()) errors.push('Waiver reason');
  if ((values.waiverType ?? 'Temporary') === 'Temporary' && !values.expiryDate) errors.push('Expiry date');
  return errors;
}
