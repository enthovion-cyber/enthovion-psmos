import { incidentDetailService } from './incident-detail.service';
export const incidentReportTemplateService = { list: incidentDetailService.finalReportTemplates, select: incidentDetailService.selectFinalReportTemplate };
