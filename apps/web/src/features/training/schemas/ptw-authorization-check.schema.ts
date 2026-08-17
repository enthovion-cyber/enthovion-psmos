export function validatePtwAuthorizationCheck(input: Record<string, any>) {
  const errors: string[] = [];
  if (!String(input.workerId ?? input.worker_id ?? input.userId ?? input.user_id ?? '').trim()) errors.push('Worker or linked user is required.');
  if (!String(input.ptwRole ?? input.ptw_role ?? '').trim()) errors.push('PTW role is required.');
  return errors;
}
