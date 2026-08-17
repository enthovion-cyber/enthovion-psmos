export const completionStatuses = ['Completed', 'Failed', 'Incomplete', 'Expired', 'Superseded'] as const;
export const verificationStatuses = ['Not Required', 'Pending Verification', 'Verified', 'Rejected'] as const;
export const approvalStatuses = ['Not Required', 'Pending Approval', 'Approved', 'Rejected'] as const;

export function validateCompletionRecord(value: Record<string, any>) {
  const missing = [];
  if (!value.workerId && !value.worker_id) missing.push('workerId');
  if (!value.trainingItemId && !value.training_item_id) missing.push('trainingItemId');
  if (!value.completionStatus && !value.completion_status) missing.push('completionStatus');
  return missing;
}
