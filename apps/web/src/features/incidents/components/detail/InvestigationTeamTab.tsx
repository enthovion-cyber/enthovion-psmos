'use client';

import { useCallback, useState } from 'react';
import { AddEditTeamMemberDrawer } from '../investigation-team/AddEditTeamMemberDrawer';
import { AvailabilityConflictWorkloadPanel } from '../investigation-team/AvailabilityConflictWorkloadPanel';
import { ChangeReplaceTeamMemberDrawer } from '../investigation-team/ChangeReplaceTeamMemberDrawer';
import { CompetencyTrainingIndependencePanel } from '../investigation-team/CompetencyTrainingIndependencePanel';
import { EscalationManagementOversightPanel } from '../investigation-team/EscalationManagementOversightPanel';
import { InvestigationOwnerLeadPanel } from '../investigation-team/InvestigationOwnerLeadPanel';
import { InvestigationTeamHeader } from '../investigation-team/InvestigationTeamHeader';
import { MeetingSessionPlanningPanel } from '../investigation-team/MeetingSessionPlanningPanel';
import { RequiredRolesDisciplineMatrixPanel } from '../investigation-team/RequiredRolesDisciplineMatrixPanel';
import { RolesResponsibilitiesRaciPanel } from '../investigation-team/RolesResponsibilitiesRaciPanel';
import { TeamAssignmentAcceptancePanel } from '../investigation-team/TeamAssignmentAcceptancePanel';
import { TeamChangeHistoryPanel } from '../investigation-team/TeamChangeHistoryPanel';
import { TeamCommunicationNotificationsPanel } from '../investigation-team/TeamCommunicationNotificationsPanel';
import { TeamMembersRegister } from '../investigation-team/TeamMembersRegister';
import { TeamReadinessPanel } from '../investigation-team/TeamReadinessPanel';
import { TeamReviewPanel } from '../investigation-team/TeamReviewPanel';
import { TeamSummaryCards } from '../investigation-team/TeamSummaryCards';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentInvestigationTeam, useIncidentInvestigationTeamMutations } from '../../hooks/useIncidentInvestigationTeam';

export function InvestigationTeamTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentInvestigationTeam(incidentId);
  const mutations = useIncidentInvestigationTeamMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [replaceForm, setReplaceForm] = useState<Record<string, any>>({});
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.entries(mutations).some(([key, mutation]: any) => key !== 'searchUsers' && mutation.isPending);
  const searchUsers = useCallback((search: string) => mutations.searchUsers.mutateAsync({ search }), [mutations.searchUsers]);
  if (isLoading) return <TabStatePanel title="Loading Investigation Team" message="Loading real owner, members, required roles, RACI, notifications, review, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Investigation Team" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Investigation Team data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view this tab.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const setReplace = (key: string, value: any) => setReplaceForm((current) => ({ ...current, [key]: value }));
  const add = () => { setForm({ acceptanceStatus: 'Pending Acceptance', activeStatus: 'Pending Acceptance', acceptanceRequired: true, approvalStatus: 'Not Required' }); setDrawerOpen(true); };
  const edit = (row: any) => { setForm(fromMemberRow(row)); setDrawerOpen(true); };
  const save = async () => { try { if (form.id) await mutations.updateMember.mutateAsync({ memberId: form.id, values: form }); else await mutations.createMember.mutateAsync(form); setDrawerOpen(false); setMessage('Team member saved.'); } catch (event) { setMessage(errorText(event)); } };
  const remove = async (row: any) => { const reason = window.prompt('Reason for removing this investigation team member'); if (!reason) return; try { await mutations.removeMember.mutateAsync({ memberId: row.id, values: { reason } }); setMessage('Team member removed.'); } catch (event) { setMessage(errorText(event)); } };
  const notify = async (row?: any) => { try { await mutations.sendNotification.mutateAsync({ memberId: row?.id, subject: 'Incident investigation team assignment', message: row?.notification_message ?? row?.notificationMessage ?? 'Please review your investigation team assignment.' }); setMessage('Team notification sent.'); } catch (event) { setMessage(errorText(event)); } };
  const reminder = async () => { try { await mutations.sendReminders.mutateAsync({ message: 'Reminder: please respond to your incident investigation team assignment.' }); setMessage('Team reminders sent.'); } catch (event) { setMessage(errorText(event)); } };
  const accept = async (row: any) => { try { await mutations.acceptMember.mutateAsync({ memberId: row.id, values: { reason: 'Marked accepted from Investigation Team tab.' } }); setMessage('Member marked accepted.'); } catch (event) { setMessage(errorText(event)); } };
  const decline = async (row: any) => { const reason = window.prompt('Reason for decline'); if (!reason) return; try { await mutations.declineMember.mutateAsync({ memberId: row.id, values: { reason } }); setMessage('Member marked declined.'); } catch (event) { setMessage(errorText(event)); } };
  const replace = (row: any) => { setSelectedMember(row); setReplaceForm({ currentMemberId: row.id, transferResponsibilities: true, transferRaciAssignments: true, notifyOldMember: true, notifyNewMember: true, newMemberAcceptanceRequired: true }); setReplaceOpen(true); };
  const saveReplacement = async () => { if (!selectedMember) return; try { await mutations.replaceMember.mutateAsync({ memberId: selectedMember.id, values: replaceForm }); setReplaceOpen(false); setSelectedMember(null); setMessage('Team member replacement saved.'); } catch (event) { setMessage(errorText(event)); } };
  const assignOwner = async () => { const ownerId = window.prompt('Owner user ID'); if (!ownerId) return; const reason = window.prompt('Reason for owner assignment/change'); if (!reason) return; try { await mutations.updateOwnerLead.mutateAsync({ investigationOwnerId: ownerId, reason }); setMessage('Investigation owner updated.'); } catch (event) { setMessage(errorText(event)); } };
  const assignLead = async () => { const leadId = window.prompt('Lead investigator team member ID or user ID'); if (!leadId) return; const reason = window.prompt('Reason for lead assignment/change'); if (!reason) return; try { await mutations.updateOwnerLead.mutateAsync({ leadInvestigatorId: leadId, reason }); setMessage('Investigation lead updated.'); } catch (event) { setMessage(errorText(event)); } };
  const createAction = async (row?: any) => { setMessage(row ? `Create action requested for ${row.display_name ?? row.email}.` : 'Create action requested.'); };
  const scheduleMeeting = async () => { setMessage('Schedule Meeting uses the incident team/session integration when configured.'); };
  const requestReview = async () => { try { await mutations.requestReview.mutateAsync({ reason: 'Investigation Team review requested' }); setMessage('Review requested.'); } catch (event) { setMessage(errorText(event)); } };
  const approve = async () => { try { await mutations.approveReview.mutateAsync({ reason: 'Investigation Team approved' }); setMessage('Review approved.'); } catch (event) { setMessage(errorText(event)); } };
  const reject = async () => { const reason = window.prompt('Reason for rejection'); if (!reason) return; try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('Review rejected.'); } catch (event) { setMessage(errorText(event)); } };

  return <div className="grid gap-4">
    <InvestigationTeamHeader data={data} saving={saving} message={message} onAdd={add} onAssignOwner={assignOwner} onAssignLead={assignLead} onGenerateRoles={() => mutations.generateRoles.mutate()} onNotify={() => notify()} onReminder={reminder} onRequestReview={requestReview} onApprove={approve} onReject={reject} onScheduleMeeting={scheduleMeeting} onCreateAction={() => createAction()} onSave={() => setMessage('No unsaved header changes.')} onRefresh={() => refetch()} />
    <TeamSummaryCards cards={data.summaryCards ?? []} charts={data.charts} />
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><TeamMembersRegister rows={data.membersRegister ?? []} onEdit={edit} onDelete={remove} onReplace={replace} onNotify={notify} onAccept={accept} onDecline={decline} onCreateAction={createAction} canDelete={data.permissions?.canDelete || data.permissions?.canRemoveMember} canReplace={data.permissions?.canReplace} /><TeamReadinessPanel readiness={data.readiness} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><InvestigationOwnerLeadPanel data={data.ownerLead} onAssignOwner={assignOwner} onAssignLead={assignLead} /><RequiredRolesDisciplineMatrixPanel rows={data.requiredRolesMatrix ?? []} /><TeamAssignmentAcceptancePanel rows={data.assignmentAcceptance} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><RolesResponsibilitiesRaciPanel rows={data.raci ?? []} /><CompetencyTrainingIndependencePanel data={data.competencyTrainingIndependence} /><AvailabilityConflictWorkloadPanel data={data.availabilityConflictWorkload} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><MeetingSessionPlanningPanel data={data.meetingSessionPlanning} /><TeamCommunicationNotificationsPanel data={data.communicationNotifications} onNotify={() => notify()} onReminder={reminder} /><EscalationManagementOversightPanel data={data.escalationManagementOversight} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><TeamReviewPanel review={data.review} onRequest={requestReview} onApprove={approve} onReject={reject} /><TeamChangeHistoryPanel rows={data.changeHistory ?? []} /></div>
    <AddEditTeamMemberDrawer open={drawerOpen} form={form} set={set} saving={saving} onClose={() => setDrawerOpen(false)} onSave={save} onSearchUsers={searchUsers} />
    <ChangeReplaceTeamMemberDrawer open={replaceOpen} currentMember={selectedMember} form={replaceForm} set={setReplace} saving={saving} onClose={() => setReplaceOpen(false)} onSave={saveReplacement} />
  </div>;
}

function fromMemberRow(row: any) {
  return { id: row.id, userId: row.user_id, userSearch: row.display_name ?? row.email, displayName: row.display_name, email: row.email, phone: row.phone, organization: row.organization ?? row.company_name, contractorCompany: row.contractor_company, internalExternal: row.internal_external, jobTitle: row.job_title, department: row.department, discipline: row.discipline, teamRole: row.team_role, responsibility: row.responsibility, raciRole: row.raci_role, requiredMember: !!row.required_member, requiredRole: !!row.required_role, leadInvestigator: !!row.lead_investigator, reviewer: !!row.reviewer, approver: !!row.approver, acceptanceRequired: !!row.acceptance_required, approvalRequired: !!row.approval_required, acceptanceDueAt: row.acceptance_due_at, acceptanceStatus: row.acceptance_status, activeStatus: row.active_status, approvalStatus: row.approval_status, competencyCheckRequired: !!row.competency_check_required, competencyStatus: row.competency_status, trainingStatus: row.training_status, trainingRecords: row.training_records, independenceStatus: row.independence_status, conflictCheckRequired: !!row.conflict_check_required, conflictDeclared: !!row.conflict_declared, conflictStatus: row.conflict_status, conflictNotes: row.conflict_notes, availabilityStatus: row.availability_status, capacityPercent: row.capacity_percent, backupMember: row.backup_member, workloadStatus: row.workload_status, notificationStatus: row.notification_status, notificationMessage: row.notification_message, notes: row.notes, status: row.status, changeReason: row.change_reason };
}
