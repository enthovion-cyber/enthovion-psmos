import { incidentDetailService } from './incident-detail.service';

export const incidentPeopleService = {
  tab: incidentDetailService.peopleInjury,
  create: incidentDetailService.createPerson,
  update: incidentDetailService.updatePerson,
  remove: incidentDetailService.deletePerson,
  requestReview: incidentDetailService.requestPeopleReview,
  approveReview: incidentDetailService.approvePeopleReview,
  rejectReview: incidentDetailService.rejectPeopleReview
};
