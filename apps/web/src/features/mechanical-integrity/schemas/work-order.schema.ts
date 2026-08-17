export const workOrderRequiredFields = ['equipmentId', 'title', 'workOrderType', 'priority', 'riskLevel'];

export function validateWorkOrderDraft(input: Record<string, unknown>) {
  const missing = workOrderRequiredFields.filter((field) => !input[field]);
  if ((input.riskLevel === 'High' || input.riskLevel === 'Critical' || input.priority === 'Urgent' || input.priority === 'Emergency') && !input.ownerUserId) missing.push('ownerUserId');
  if ((input.riskLevel === 'High' || input.riskLevel === 'Critical' || input.priority === 'Urgent' || input.priority === 'Emergency') && !input.dueDate) missing.push('dueDate');
  if (input.startupBlocker && !input.startupBlockerReason) missing.push('startupBlockerReason');
  return missing;
}
