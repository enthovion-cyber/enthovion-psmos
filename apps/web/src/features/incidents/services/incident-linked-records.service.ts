import { incidentDetailService } from './incident-detail.service';

export const incidentLinkedRecordsService = {
  tab: incidentDetailService.linkedRecords,
  create: incidentDetailService.createLinkedRecord,
  update: incidentDetailService.updateLinkedRecord,
  delete: incidentDetailService.deleteLinkedRecord,
  autoDetect: incidentDetailService.autoDetectLinkedRecords,
  refresh: incidentDetailService.refreshLinkedRecord,
  refreshAll: incidentDetailService.refreshAllLinkedRecords,
  updateImpact: incidentDetailService.updateLinkedRecordImpact,
  createFollowup: incidentDetailService.createLinkedRecordFollowup,
  requestReview: incidentDetailService.requestLinkedRecordsReview,
  approveReview: incidentDetailService.approveLinkedRecordsReview,
  rejectReview: incidentDetailService.rejectLinkedRecordsReview,
  export: incidentDetailService.exportLinkedRecords
};
