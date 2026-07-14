import { incidentDetailService } from './incident-detail.service';

export const incidentNotificationsReportingService = {
  tab: incidentDetailService.notificationsReporting,
  runDetermination: incidentDetailService.runReportingDetermination,
  updateDetermination: incidentDetailService.updateReportingDetermination,
  sendNotification: incidentDetailService.sendIncidentNotification,
  resendNotification: incidentDetailService.resendIncidentNotification,
  acknowledgeNotification: incidentDetailService.acknowledgeIncidentNotification,
  createReport: incidentDetailService.createRegulatoryReport,
  updateReport: incidentDetailService.updateRegulatoryReport,
  generatePackage: incidentDetailService.generateRegulatoryPackage,
  requestApproval: incidentDetailService.requestRegulatoryApproval,
  markSubmitted: incidentDetailService.markRegulatorySubmitted,
  addAcknowledgement: incidentDetailService.addRegulatoryAcknowledgement,
  markRejected: incidentDetailService.markRegulatoryRejected,
  createStakeholder: incidentDetailService.createExternalStakeholderNotification,
  createFollowup: incidentDetailService.createReportingFollowup,
  requestReview: incidentDetailService.requestReportingReview,
  approveReview: incidentDetailService.approveReportingReview,
  rejectReview: incidentDetailService.rejectReportingReview,
  exportLog: incidentDetailService.exportReportingLog
};
