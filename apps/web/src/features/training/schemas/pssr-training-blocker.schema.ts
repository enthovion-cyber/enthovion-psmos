export function validatePssrTrainingBlocker(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.blockerTitle ?? values.blocker_title ?? '').trim()) errors.push('Blocker title');
  if (!String(values.blockerType ?? values.blocker_type ?? '').trim()) errors.push('Blocker type');
  return errors;
}

