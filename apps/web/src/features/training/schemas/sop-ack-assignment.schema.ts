export function validateSopAckAssignmentAction(values: Record<string, any>) {
  return String(values.reason ?? '').trim() ? [] : ['Reason'];
}
