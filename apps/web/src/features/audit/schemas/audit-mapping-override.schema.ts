export function validateAuditMappingOverride(values: Record<string, FormDataEntryValue>) {
  const errors: string[] = [];
  if (!String(values.overrideType ?? "").trim()) errors.push("Override type is required.");
  if (!String(values.overrideReason ?? "").trim()) errors.push("Override reason is required.");
  if (!String(values.riskComplianceJustification ?? "").trim()) errors.push("Risk/compliance justification is required.");
  return errors;
}
