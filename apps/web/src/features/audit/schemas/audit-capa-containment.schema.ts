export function validateAuditCapaContainment(input: Record<string, any>) {
  if (!input.containmentRequired) return [];
  return [!input.containmentDescription ? "Containment description is required when containment is required." : "", !input.containmentOwnerUserId ? "Containment owner is required." : ""].filter(Boolean);
}
