import type { CompleteSignupInput } from '../types/signup.types';

export function workspaceSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export function validateCompleteSignup(input: CompleteSignupInput) {
  const errors: string[] = [];
  if (!/^\S+@\S+\.\S+$/.test(input.email)) errors.push('Verified email is missing.');
  if (input.fullName.trim().length < 2) errors.push('Full name is required.');
  if (input.workspaceName.trim().length < 2) errors.push('Workspace name is required.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.workspaceSlug)) errors.push('Workspace slug can use lowercase letters, numbers, and hyphens.');
  return errors;
}
