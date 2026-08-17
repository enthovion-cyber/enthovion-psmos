export function validatePtwAuthorizationRequest(input: Record<string, any>) {
  const errors: string[] = [];
  if (!String(input.workerId ?? input.worker_id ?? '').trim()) errors.push('Worker is required.');
  if (!String(input.requestedPtwRole ?? input.requested_ptw_role ?? '').trim()) errors.push('Requested PTW role is required.');
  return errors;
}
