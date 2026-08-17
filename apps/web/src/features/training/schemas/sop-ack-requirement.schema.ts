export function validateSopAckRequirement(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.requirementCode ?? values.requirement_code ?? '').trim()) errors.push('Requirement code');
  if (!String(values.requirementTitle ?? values.requirement_title ?? '').trim()) errors.push('Requirement title');
  if (['Active', 'Approved'].includes(String(values.requirementStatus ?? values.requirement_status ?? '')) && !(values.sopId || values.sop_id || values.documentId || values.document_id)) errors.push('SOP or Document Control link');
  if ((values.safetyCritical || values.safety_critical) && !(values.ownerUserId || values.owner_user_id)) errors.push('Safety-critical owner');
  if ((values.recurring || values.recurring === true) && !(values.recurrenceIntervalDays || values.recurrence_interval_days)) errors.push('Recurrence interval days');
  return errors;
}
