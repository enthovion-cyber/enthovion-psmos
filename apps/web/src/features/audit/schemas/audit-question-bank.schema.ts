export const validateQuestionBank = (v: Record<string, unknown>) =>
  ["questionCode", "questionText", "questionType", "responseType"].filter(
    (k) => !v[k],
  );
