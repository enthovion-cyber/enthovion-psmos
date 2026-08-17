export function validateAuditMappingGap(values: Record<string, FormDataEntryValue>) {
  const errors: string[] = [];
  if (!String(values.gapTitle ?? "").trim()) errors.push("Gap title is required.");
  if (!String(values.gapType ?? "").trim()) errors.push("Gap type is required.");
  return errors;
}
