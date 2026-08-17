export function validateCertificateDecision(values: Record<string, unknown>, action: 'verify' | 'reject' | 'revoke') {
  const errors: string[] = [];
  if (action !== 'verify' && !String(values.reason ?? '').trim()) errors.push(`${action} requires a reason.`);
  return errors;
}
