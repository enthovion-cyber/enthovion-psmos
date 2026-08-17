export function validateInspectionReading(input: Record<string, unknown>) {
  const missing: string[] = [];
  if (!input.cmlId) missing.push('CML/TML');
  if (!input.readingDate) missing.push('Reading date');
  if (!input.notInspected && !input.notAccessible && !input.currentThickness) missing.push('Current thickness');
  if (input.notInspected && !input.notInspectedReason) missing.push('Not inspected reason');
  if (input.notAccessible && !input.notAccessibleReason) missing.push('Not accessible reason');
  return missing;
}
