export function validateAuditStandardForm(values: Record<string, FormDataEntryValue>) {
  const errors: string[] = [];
  if (!String(values.standardCode ?? "").trim()) errors.push("Standard code is required.");
  if (!String(values.standardName ?? "").trim()) errors.push("Standard name is required.");
  return errors;
}
