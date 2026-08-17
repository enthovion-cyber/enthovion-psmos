export const trainingRecordSettingsKeys = ['attendance_required_for_completion', 'evidence_required_for_safety_critical', 'verification_required_for_manual_records', 'approval_required_for_verified_records', 'lock_attendance_after_submit', 'manual_correction_requires_reason', 'cross_site_worker_requires_permission', 'document_control_required_for_certificates', 'audit_downloads_exports'] as const;

export function normalizeTrainingRecordSettings(value: Record<string, any>) {
  return Object.fromEntries(trainingRecordSettingsKeys.map((key) => [key, Boolean(value[key])]));
}
