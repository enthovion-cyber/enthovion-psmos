export function validateAuditCapaEffectiveness(input: Record<string, any>) {
  return input.effectivenessRequired ? [!input.effectivenessMethod ? "Effectiveness method is required when effectiveness is required." : ""].filter(Boolean) : [];
}
