export function validateAuditCapa(input: Record<string, any>) {
  const errors: string[] = [];
  if (!input.capaTitle) errors.push("CAPA title is required.");
  if (input.capaStatus && input.capaStatus !== "Draft" && !input.primaryFindingId) errors.push("Opening CAPA requires source finding.");
  if (input.capaStatus && input.capaStatus !== "Draft" && !input.capaOwnerUserId) errors.push("Opening CAPA requires CAPA owner.");
  return errors;
}
