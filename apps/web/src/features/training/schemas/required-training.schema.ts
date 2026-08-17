export function validateRequiredTrainingIdentity(value: Record<string, any>) {
  const errors: string[] = [];
  if (!String(value.trainingTitle ?? value.training_title ?? value.title ?? '').trim()) errors.push('Training title');
  if (!String(value.trainingCode ?? value.training_code ?? value.code ?? '').trim()) errors.push('Training code');
  if (!String(value.trainingCategory ?? value.training_category ?? '').trim()) errors.push('Training category');
  if (!String(value.trainingType ?? value.training_type ?? '').trim()) errors.push('Training type');
  if (value.nextReviewDate && value.effectiveDate && String(value.nextReviewDate) < String(value.effectiveDate)) errors.push('Next review date must be after effective date');
  return errors;
}

export function requiredTrainingDisabledReason(action: string, item?: { status?: string | null; archived_at?: string | null; readiness_status?: string | null }) {
  if (!item) return 'Required training record is not loaded.';
  if (item.archived_at || item.status === 'Archived') return `${action} is disabled because this training item is archived.`;
  if (['Approved Current', 'Superseded'].includes(String(item.status ?? ''))) return `${action} requires a new version or controlled edit reason because the current record is approved/read-only.`;
  return '';
}
