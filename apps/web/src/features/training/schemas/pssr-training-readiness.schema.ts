export function validatePssrTrainingReadiness(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.pssrId ?? values.pssr_id ?? '').trim()) errors.push('Linked PSSR');
  if (!String(values.readinessTitle ?? values.readiness_title ?? '').trim()) errors.push('Readiness title');
  if (!String(values.readinessSource ?? values.readiness_source ?? '').trim()) errors.push('Readiness source');
  if ((values.trainingRequired ?? values.training_required) && !String(values.trainingRequiredReason ?? values.training_required_reason ?? '').trim()) errors.push('Training required reason');
  if ((values.approvalBlocker ?? values.approval_blocker) && !String(values.approvalBlockerReason ?? values.approval_blocker_reason ?? '').trim()) errors.push('Approval blocker reason');
  if ((values.handoverBlocker ?? values.handover_blocker) && !String(values.handoverBlockerReason ?? values.handover_blocker_reason ?? '').trim()) errors.push('Handover blocker reason');
  return errors;
}

