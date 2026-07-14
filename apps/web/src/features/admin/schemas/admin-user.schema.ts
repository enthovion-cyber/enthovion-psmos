export const adminUserRequiredFields = ['email', 'displayName', 'roleIds'];

export function validateAdminUserDraft(value: { email?: string; displayName?: string; roleIds?: string[] }) {
  const missing = adminUserRequiredFields.filter((field) => {
    if (field === 'roleIds') return !(value.roleIds ?? []).length;
    return !value[field as 'email' | 'displayName'];
  });
  return { valid: missing.length === 0, missing };
}
