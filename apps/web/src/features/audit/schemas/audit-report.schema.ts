export const auditReportRequiredFields = ["sourceModule", "sourceRecordId", "reportTitle", "reportType"];
export function validateAuditReportDraft(value: Record<string, unknown>) {
  return auditReportRequiredFields.filter((field) => !String(value[field] ?? "").trim());
}
