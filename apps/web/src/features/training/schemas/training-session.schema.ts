export const trainingSessionRequiredFields = ['sessionTitle', 'trainingItemId', 'siteId', 'startTime', 'endTime'] as const;

export function validateTrainingSessionDraft(value: Record<string, any>) {
  return trainingSessionRequiredFields.filter((field) => !value[field] && !value[field.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)]);
}
