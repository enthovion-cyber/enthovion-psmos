export function validateRepeatFindingReview(input: Record<string, unknown>) {
  return String(input.reason ?? input.reviewReason ?? input.review_reason ?? '').trim() ? [] : ['Review reason is required.'];
}
