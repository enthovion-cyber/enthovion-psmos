export function validateLogin(input: { email?: string; password?: string }) {
  const errors: string[] = [];
  if (!input.email || !input.email.includes('@')) errors.push('Enter a valid email address.');
  if (!input.password) errors.push('Password is required.');
  return errors;
}
