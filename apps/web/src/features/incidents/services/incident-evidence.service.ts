import { incidentDetailService } from './incident-detail.service';

export const incidentEvidenceService = {
  tab: incidentDetailService.evidenceAttachments,
  create: incidentDetailService.createEvidence,
  update: incidentDetailService.updateEvidence,
  remove: incidentDetailService.deleteIncidentEvidence,
  archive: incidentDetailService.archiveEvidence,
  version: incidentDetailService.createEvidenceVersion,
  mapping: incidentDetailService.createEvidenceMapping,
  custody: incidentDetailService.createEvidenceCustody,
  preview: incidentDetailService.previewEvidence,
  download: incidentDetailService.downloadEvidence,
  requestReview: incidentDetailService.requestEvidenceReview,
  approveReview: incidentDetailService.approveEvidenceReview,
  rejectReview: incidentDetailService.rejectEvidenceReview,
  exportIndex: incidentDetailService.exportEvidenceIndex
};
