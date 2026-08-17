export const trainingRosterRequiredFields = ['workerId', 'sessionId'] as const;

export function validateTrainingRosterEntry(value: Record<string, any>) {
  return trainingRosterRequiredFields.filter((field) => !value[field] && !value[field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]);
}
