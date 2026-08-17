export const auditFindingRequiredFields = ["findingTitle", "sourceType"] as const;
export function auditFindingMissingFields(input: Record<string, unknown>) {
  const missing = auditFindingRequiredFields.filter((field) => !input[field]);
  if ((input.sourceType ?? "Manual Finding") === "Manual Finding" && !input.manualSourceReason && !input.sourceDescription) missing.push("manualSourceReason" as any);
  return missing;
}
