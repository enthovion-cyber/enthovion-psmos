export function validateMocTrainingRequirement(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.mocId ?? values.moc_id ?? '').trim()) errors.push('Linked MOC');
  if (!String(values.requirementTitle ?? values.requirement_title ?? '').trim()) errors.push('Requirement title');
  if (!String(values.requirementSource ?? values.requirement_source ?? '').trim()) errors.push('Requirement source');
  if ((values.trainingRequired ?? values.training_required) && !String(values.trainingRequiredReason ?? values.training_required_reason ?? '').trim()) errors.push('Training required reason');
  if ((values.implementationBlocker ?? values.implementation_blocker) && !String(values.implementationBlockerReason ?? values.implementation_blocker_reason ?? '').trim()) errors.push('Implementation blocker reason');
  if ((values.closureBlocker ?? values.closure_blocker) && !String(values.closureBlockerReason ?? values.closure_blocker_reason ?? '').trim()) errors.push('Closure blocker reason');
  return errors;
}
