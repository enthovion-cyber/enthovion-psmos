export function validateWorkOrderVerification(input: Record<string, unknown>) {
  return ['verificationMethod', 'verificationResult'].filter((field) => !input[field]);
}
