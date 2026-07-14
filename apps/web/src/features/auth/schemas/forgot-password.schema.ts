export function validateForgotPassword(input: { email?: string }) {
  return !input.email || !input.email.includes('@') ? ['Enter a valid email address.'] : [];
}
