export function validateAuditCapaEvidence(input: Record<string, any>) {
  return [!input.evidenceTitle ? "Evidence title is required." : "", !input.evidenceType ? "Evidence type is required." : ""].filter(Boolean);
}
