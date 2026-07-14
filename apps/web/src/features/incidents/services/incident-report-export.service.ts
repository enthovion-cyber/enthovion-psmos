import { incidentDetailService } from './incident-detail.service';
export const incidentReportExportService = { export: incidentDetailService.exportFinalReport, download: incidentDetailService.downloadFinalReport };
