export function validateBillingEmail(email?: string) {
  if (!email) return ['Billing email is required.'];
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? [] : ['Billing email must be valid.'];
}
