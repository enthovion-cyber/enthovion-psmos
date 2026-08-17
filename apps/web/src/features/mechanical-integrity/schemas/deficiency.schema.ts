export const deficiencyRequiredFields = ['equipmentId', 'title', 'deficiencyType', 'severity', 'riskLevel'];

export function validateDeficiencyDraft(input: Record<string, unknown>) {
  return deficiencyRequiredFields.filter((field) => !input[field]);
}
