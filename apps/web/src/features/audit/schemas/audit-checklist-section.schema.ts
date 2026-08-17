export const validateChecklistSection = (v: Record<string, unknown>) =>
  ["sectionCode", "sectionTitle", "sectionOrder"].filter((k) => !v[k]);
