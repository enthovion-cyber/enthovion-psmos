import { incidentLessonsService } from './incident-lessons.service';
export const incidentLessonReviewService = { request: incidentLessonsService.requestReview, approve: incidentLessonsService.approveReview, reject: incidentLessonsService.rejectReview };
