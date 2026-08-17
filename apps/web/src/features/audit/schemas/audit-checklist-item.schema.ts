export const validateChecklistItem = (v: Record<string, unknown>) =>
  [
    "sectionId",
    "itemCode",
    "itemText",
    "itemOrder",
    "questionType",
    "responseType",
  ].filter((k) => !v[k]);
