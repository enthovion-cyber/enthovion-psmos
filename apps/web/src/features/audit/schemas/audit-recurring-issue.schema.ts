export function validateRecurringIssueTransition(input: Record<string, unknown>) {
  return String(input.reason ?? input.closureNote ?? input.closure_note ?? '').trim() ? [] : ['Reason or closure note is required.'];
}
