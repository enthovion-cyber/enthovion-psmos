export function validateSopAcknowledgement(values: Record<string, any>) {
  const errors: string[] = [];
  if (!String(values.acknowledgedVersion ?? values.acknowledged_version ?? '').trim()) errors.push('Acknowledged version');
  if (!values.confirmDeclaration) errors.push('Read-and-understood declaration');
  return errors;
}
