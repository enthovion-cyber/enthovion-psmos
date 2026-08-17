export function validateCertificate(values: Record<string, unknown>) {
  const errors: string[] = [];
  if (!String(values.workerId ?? '').trim()) errors.push('Worker is required.');
  if (!String(values.certificateTitle ?? '').trim()) errors.push('Certificate title is required.');
  if (!String(values.certificateCategory ?? '').trim()) errors.push('Certificate category is required.');
  if (values.issueDate && values.expiryDate && !values.noExpiry && new Date(String(values.expiryDate)) <= new Date(String(values.issueDate))) errors.push('Expiry date must be after issue date.');
  return errors;
}
