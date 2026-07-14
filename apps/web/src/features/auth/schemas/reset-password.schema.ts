export function validateResetPassword(input: { password?: string; confirmPassword?: string }) {
  const errors: string[] = [];
  if (!input.password || input.password.length < 12) errors.push('Password must be at least 12 characters.');
  if (input.password !== input.confirmPassword) errors.push('Password confirmation must match.');
  return errors;
}
