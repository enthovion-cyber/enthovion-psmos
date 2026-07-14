export function validateAcceptInvite(input: { token?: string; displayName?: string; password?: string; confirmPassword?: string }) {
  const errors: string[] = [];
  if (!input.token) errors.push('Invitation token is required.');
  if (!input.displayName) errors.push('Full name is required.');
  if (!input.password || input.password.length < 12) errors.push('Password must be at least 12 characters.');
  if (input.password !== input.confirmPassword) errors.push('Password confirmation must match.');
  return errors;
}
