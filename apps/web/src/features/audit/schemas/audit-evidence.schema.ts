export function validateAuditEvidence(payload: Record<string, any>) {
  const missing = ["evidenceTitle", "evidenceType", "confidentialityLevel"].filter((key) => !payload[key]);
  if (missing.length) return `Missing required evidence fields: ${missing.join(", ")}.`;
  if (!payload.documentId && !payload.storageFileId && !payload.linkedRecordId && !payload.textEvidenceNote && !payload.externalReference) return "Evidence must include a file/document/module link, text note, or external reference.";
  return "";
}
