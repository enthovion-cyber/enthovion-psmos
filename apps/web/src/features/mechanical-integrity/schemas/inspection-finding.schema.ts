export function validateInspectionFinding(input: Record<string, unknown>) {
  const missing: string[] = [];
  if (!input.title) missing.push('Title');
  if (!input.findingType) missing.push('Finding type');
  if (!input.severity) missing.push('Severity');
  return missing;
}
