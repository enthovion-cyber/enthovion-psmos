export function validateAuditEvidenceRequirement(payload: Record<string, any>) {
  const missing = ["requirementTitle", "sourceModule", "sourceRecordId"].filter((key) => !payload[key]);
  return missing.length ? `Missing requirement fields: ${missing.join(", ")}.` : "";
}
