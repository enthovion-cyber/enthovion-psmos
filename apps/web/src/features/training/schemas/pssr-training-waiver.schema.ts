export function validatePssrTrainingWaiver(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.waiverReason ?? values.waiver_reason ?? '').trim()) errors.push('Waiver reason');
  if (!String(values.riskAcceptanceBasis ?? values.risk_acceptance_basis ?? '').trim()) errors.push('Risk acceptance basis');
  return errors;
}

