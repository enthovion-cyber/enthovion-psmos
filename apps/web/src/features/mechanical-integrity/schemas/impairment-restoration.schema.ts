export function validateImpairmentRestoration(input: Record<string, unknown>) {
  const missing: string[] = [];
  if (!input.restoredAt) missing.push('Restoration date/time is required.');
  if (!input.restorationMethod) missing.push('Restoration method is required.');
  if (input.functionalTestRequired && !input.functionalTestCompleted) missing.push('Functional test completion is required before verification.');
  if (!input.notes) missing.push('Restoration notes are required.');
  return missing;
}
