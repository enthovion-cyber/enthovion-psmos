export const adminRoleRequiredFields = ['key', 'name'];

export function validateAdminRoleDraft(value: { key?: string; name?: string }) {
  const missing = adminRoleRequiredFields.filter((field) => !value[field as 'key' | 'name']);
  return { valid: missing.length === 0, missing };
}
