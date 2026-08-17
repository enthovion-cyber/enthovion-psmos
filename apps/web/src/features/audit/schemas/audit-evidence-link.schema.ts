export function validateAuditEvidenceLink(payload: Record<string, any>) {
  const missing = ["linkedModule", "linkedRecordId"].filter((key) => !payload[key]);
  return missing.length ? `Missing evidence link fields: ${missing.join(", ")}.` : "";
}
