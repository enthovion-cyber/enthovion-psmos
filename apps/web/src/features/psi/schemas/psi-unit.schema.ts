export const psiUnitRequiredFields = ['unit_name', 'unit_code', 'site_id'];

export function validatePsiUnitDraft(input: Record<string, unknown>) {
  return psiUnitRequiredFields.filter((field) => !input[field]);
}
