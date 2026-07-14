import { incidentLinkedRecordsService } from './incident-linked-records.service';
export const incidentLinkedRecordReviewService = { request: incidentLinkedRecordsService.requestReview, approve: incidentLinkedRecordsService.approveReview, reject: incidentLinkedRecordsService.rejectReview };
