export const trainingReportTemplateRequiredFields = ['templateName', 'templateCode', 'reportType', 'sourceModule', 'defaultFormat'];
export const trainingReportGenerateRequiredFields = ['reportType', 'sourceModule', 'exportFormat'];
export const trainingReportPackageRequiredFields = ['packageTitle', 'packageType'];
export const trainingScheduledReportRequiredFields = ['scheduleTitle', 'templateId', 'frequency', 'exportFormat'];

export function trainingReportMissingFields(data: Record<string, any>, fields: string[]) {
  return fields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');
}
