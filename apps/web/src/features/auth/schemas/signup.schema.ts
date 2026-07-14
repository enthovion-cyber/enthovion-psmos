import type { SignupEmailInput } from '../types/signup.types';

export function validateSignup(input: SignupEmailInput) {
  const errors: string[] = [];
  if (!/^\S+@\S+\.\S+$/.test(input.email)) errors.push('Enter a valid work email.');
  if (input.password.length < 12) errors.push('Password must be at least 12 characters.');
  if (!/[A-Z]/.test(input.password)) errors.push('Password must include an uppercase letter.');
  if (!/[a-z]/.test(input.password)) errors.push('Password must include a lowercase letter.');
  if (!/[0-9]/.test(input.password)) errors.push('Password must include a number.');
  if (!/[^A-Za-z0-9]/.test(input.password)) errors.push('Password must include a special character.');
  if (input.password !== input.confirmPassword) errors.push('Passwords do not match.');
  if (!input.termsAccepted) errors.push('Accept the terms to continue.');
  return errors;
}
