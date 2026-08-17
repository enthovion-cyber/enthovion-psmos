export function validateSopAckSettings(values: Record<string, any>) {
  const errors: string[] = [];
  if (Number(values.defaultDueDaysAfterAssignment ?? values.default_due_days_after_assignment ?? 0) < 0) errors.push('Default due days must be non-negative');
  if (Number(values.defaultReminderDaysBeforeDue ?? values.default_reminder_days_before_due ?? 0) < 0) errors.push('Default reminder days must be non-negative');
  return errors;
}
