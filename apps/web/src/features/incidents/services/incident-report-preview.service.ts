import { incidentDetailService } from './incident-detail.service';
export const incidentReportPreviewService = { preview: incidentDetailService.finalReportPreview, redaction: incidentDetailService.finalReportRedactionPreview };
