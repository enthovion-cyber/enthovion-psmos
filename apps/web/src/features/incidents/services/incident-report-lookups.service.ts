import { incidentDetailService } from './incident-detail.service';
export const incidentReportLookupsService = { templates: incidentDetailService.finalReportTemplates, context: incidentDetailService.finalReportContext };
