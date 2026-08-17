export function validateReadinessDraft(values: Record<string, any>) {
  const missing: string[] = [];
  if (!values.equipmentId && !values.equipment_id) missing.push('Equipment');
  if (!values.assessmentReason && !values.assessment_reason) missing.push('Assessment reason');
  if (!values.assessorUserId && !values.assessor_user_id) missing.push('Assessor');
  return missing;
}

export function validateReadinessSubmit(values: Record<string, any>) {
  const missing = validateReadinessDraft(values);
  if (!values.proposedDecision && !values.proposed_decision) missing.push('Proposed final decision');
  if (String(values.proposedDecision ?? values.proposed_decision ?? '').includes('Restrictions') && !(values.restrictionExpiryDate ?? values.restriction_expiry_date)) missing.push('Restriction expiry / review date');
  return missing;
}
