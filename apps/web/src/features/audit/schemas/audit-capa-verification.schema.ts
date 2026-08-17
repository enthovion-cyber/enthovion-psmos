export function validateAuditCapaVerification(input: Record<string, any>) {
  return input.verificationRequired === false ? [] : [!input.verificationMethod ? "Verification method is required." : ""].filter(Boolean);
}
