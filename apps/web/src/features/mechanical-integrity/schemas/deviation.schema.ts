export const deviationRequiredFields = ['equipmentId', 'title', 'deviationType', 'requestedDeviation', 'reason', 'expiryDate'];

export function validateDeviationDraft(input: Record<string, unknown>) {
  return deviationRequiredFields.filter((field) => !input[field]);
}
