export function validateAuditMappingForm(values: Record<string, FormDataEntryValue>) {
  const errors: string[] = [];
  if (!String(values.standardId ?? "").trim()) errors.push("Standard is required.");
  if (!String(values.clauseId ?? "").trim()) errors.push("Clause is required by current mapping policy.");
  if (!String(values.mappingTitle ?? "").trim()) errors.push("Mapping title is required.");
  if (String(values.manualMapping ?? "") === "on" && !String(values.manualMappingReason ?? "").trim()) errors.push("Manual mapping reason is required.");
  return errors;
}
