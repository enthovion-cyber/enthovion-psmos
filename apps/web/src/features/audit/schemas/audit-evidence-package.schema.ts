export function validateAuditEvidencePackage(payload: Record<string, any>) {
  return payload.packageTitle ? "" : "Package title is required.";
}
