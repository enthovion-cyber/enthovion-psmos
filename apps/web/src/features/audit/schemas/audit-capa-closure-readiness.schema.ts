export function closureReadinessMissingItems(input: Record<string, any>) {
  return Array.isArray(input.missingItems) ? input.missingItems : [];
}
