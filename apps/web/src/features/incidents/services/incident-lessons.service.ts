import { incidentDetailService } from './incident-detail.service';
export const incidentLessonsService = {
  tab: incidentDetailService.lessons,
  create: incidentDetailService.createLesson,
  update: incidentDetailService.updateLesson,
  remove: incidentDetailService.deleteLesson,
  generate: incidentDetailService.generateLessons,
  linkSource: incidentDetailService.linkLessonSource,
  distribute: incidentDetailService.distributeLesson,
  verify: incidentDetailService.verifyLesson,
  requestReview: incidentDetailService.requestLessonsReview,
  approveReview: incidentDetailService.approveLessonsReview,
  rejectReview: incidentDetailService.rejectLessonsReview
};
