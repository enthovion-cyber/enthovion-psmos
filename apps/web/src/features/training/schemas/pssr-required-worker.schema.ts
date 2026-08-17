export function validatePssrRequiredWorker(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.workerId ?? values.worker_id ?? '').trim()) errors.push('Affected worker');
  if (!String(values.impactReason ?? values.impact_reason ?? '').trim()) errors.push('Affected worker reason');
  return errors;
}

