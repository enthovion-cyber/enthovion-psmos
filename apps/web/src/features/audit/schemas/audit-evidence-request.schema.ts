export function validateAuditEvidenceRequest(payload: Record<string, any>) {
  const missing = ["requestTitle", "sourceModule", "sourceRecordId", "dueDate"].filter((key) => !payload[key]);
  return missing.length ? `Missing request fields: ${missing.join(", ")}.` : "";
}
