export function validatePtwAuthorizationEvaluation(input: Record<string, any>) {
  return input.authorizationId || input.authorization_id || input.workerId || input.worker_id ? [] : ['Authorization or worker is required for targeted evaluation.'];
}
