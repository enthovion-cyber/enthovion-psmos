export function normalizeRegulatorySettings(values: Record<string, unknown>) {
  return {
    ...values,
    review_due_soon_days: Number(values.review_due_soon_days ?? 30),
    effective_soon_days: Number(values.effective_soon_days ?? 60)
  };
}
