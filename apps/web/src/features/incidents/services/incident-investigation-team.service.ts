import { incidentDetailService } from './incident-detail.service';

export const incidentInvestigationTeamService = {
  tab: incidentDetailService.investigationTeam,
  createMember: incidentDetailService.createTeamMember,
  updateMember: incidentDetailService.updateTeamMember,
  removeMember: incidentDetailService.deleteTeamMember,
  updateOwnerLead: incidentDetailService.updateTeamOwnerLead,
  acceptMember: incidentDetailService.acceptTeamMember,
  declineMember: incidentDetailService.declineTeamMember,
  replaceMember: incidentDetailService.replaceTeamMember,
  generateRoles: incidentDetailService.generateRequiredTeamRoles,
  sendNotification: incidentDetailService.sendTeamNotification,
  sendReminders: incidentDetailService.sendTeamReminders,
  updateRaci: incidentDetailService.updateTeamRaci,
  updateChecks: incidentDetailService.updateTeamChecks,
  searchUsers: incidentDetailService.searchTeamUsers,
  requestReview: incidentDetailService.requestTeamReview,
  approveReview: incidentDetailService.approveTeamReview,
  rejectReview: incidentDetailService.rejectTeamReview
};
