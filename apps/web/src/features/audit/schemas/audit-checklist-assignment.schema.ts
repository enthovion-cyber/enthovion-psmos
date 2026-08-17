export const validateChecklistAssignment = (v: Record<string, unknown>) =>
  ["checklistId"].filter((k) => !v[k]);
