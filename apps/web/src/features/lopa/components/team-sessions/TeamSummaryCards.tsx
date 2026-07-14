import { TeamStatGrid } from './TeamSessionsUi';

export function TeamSummaryCards({ summary }: { summary: any }) {
  return <TeamStatGrid cards={[
    ['Total members', summary.totalTeamMembers ?? 0],
    ['Required', summary.requiredMembers ?? 0],
    ['Optional', summary.optionalMembers ?? 0],
    ['Internal', summary.internalParticipants ?? 0],
    ['External', summary.externalParticipants ?? 0],
    ['Invited', summary.invited ?? 0, 'warning'],
    ['Accepted', summary.acceptedInvitations ?? 0, 'success'],
    ['Declined', summary.declinedInvitations ?? 0, 'danger'],
    ['Roles covered', summary.requiredRolesCovered ?? 0, 'success'],
    ['Roles missing', summary.requiredRolesMissing ?? 0, 'danger'],
    ['Disciplines covered', summary.requiredDisciplinesCovered ?? 0, 'success'],
    ['Disciplines missing', summary.requiredDisciplinesMissing ?? 0, 'warning'],
    ['Sessions scheduled', summary.sessionsScheduled ?? 0],
    ['Sessions completed', summary.sessionsCompleted ?? 0, 'success'],
    ['Cancelled', summary.sessionsCancelled ?? 0],
    ['Attendance complete', summary.attendanceComplete ?? 0, 'success'],
    ['Missing attendance', summary.missingAttendanceRecords ?? 0, 'warning'],
    ['Quorum met', summary.quorumMet ?? 0, 'success'],
    ['Quorum failed', summary.quorumNotMet ?? 0, 'danger'],
    ['Open actions', summary.openSessionActions ?? 0, 'warning'],
    ['Overdue actions', summary.overdueSessionActions ?? 0, 'danger'],
    ['Minutes complete', summary.minutesCompleted ?? 0],
    ['Minutes locked', summary.minutesLocked ?? 0, 'success'],
    ['Ready for review', summary.teamReadyForReviewStatus ?? 'Not Ready', summary.teamReadyForReviewStatus === 'Ready' ? 'success' : 'warning']
  ]} />;
}
