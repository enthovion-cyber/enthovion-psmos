import { incidentDetailService } from './incident-detail.service';

export const incidentFinalReportService = {
  tab: incidentDetailService.finalReport,
  runReadiness: incidentDetailService.runFinalReportReadiness,
  selectTemplate: incidentDetailService.selectFinalReportTemplate,
  updateSections: incidentDetailService.updateFinalReportSections,
  createSnapshot: incidentDetailService.createFinalReportSnapshot,
  generate: incidentDetailService.generateFinalReport,
  export: incidentDetailService.exportFinalReport,
  markOfficial: incidentDetailService.markFinalReportOfficial,
  publish: incidentDetailService.publishFinalReport,
  supersede: incidentDetailService.supersedeFinalReport,
  archive: incidentDetailService.archiveFinalReport,
  requestReview: incidentDetailService.requestFinalReportReview,
  approveReview: incidentDetailService.approveFinalReportReview,
  rejectReview: incidentDetailService.rejectFinalReportReview
};
