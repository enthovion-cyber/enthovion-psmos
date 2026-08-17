export function validatePtwAuthorizationRule(input: Record<string, any>) {
  const errors: string[] = [];
  if (!String(input.ruleTitle ?? input.rule_title ?? '').trim()) errors.push('Rule title is required.');
  if (!String(input.ptwRole ?? input.ptw_role ?? '').trim()) errors.push('PTW role is required.');
  return errors;
}
