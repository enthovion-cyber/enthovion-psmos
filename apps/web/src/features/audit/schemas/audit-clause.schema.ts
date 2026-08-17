export function validateAuditClauseForm(values: Record<string, FormDataEntryValue>) {
  const errors: string[] = [];
  if (!String(values.standardId ?? "").trim()) errors.push("Standard is required.");
  if (!String(values.clauseCode ?? "").trim()) errors.push("Clause code is required.");
  if (!String(values.clauseTitle ?? "").trim()) errors.push("Clause title is required.");
  return errors;
}
