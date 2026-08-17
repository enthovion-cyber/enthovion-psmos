export const inspectionRecordRequiredFields = ['equipmentId', 'inspectionType', 'inspectionMethod', 'inspectionDate'] as const;

export function validateInspectionRecordDraft(input: Record<string, unknown>) {
  const missing = inspectionRecordRequiredFields.filter((field) => !input[field]);
  if (input.planned === false && !input.unplannedReason) missing.push('unplannedReason' as any);
  return missing;
}
