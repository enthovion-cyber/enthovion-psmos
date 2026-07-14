'use client';

import { useEffect, useMemo, useState } from 'react';
import { LopaPanel } from '../overview/LopaOverviewShared';
import { AddEditTeamMemberDialog } from '../team-sessions/AddEditTeamMemberDialog';
import { CreateEditSessionDialog } from '../team-sessions/CreateEditSessionDialog';
import { InvitationParticipationPanel } from '../team-sessions/InvitationParticipationPanel';
import { QuorumRequiredRepresentationPanel } from '../team-sessions/QuorumRequiredRepresentationPanel';
import { RoleDisciplineCoverageMatrix } from '../team-sessions/RoleDisciplineCoverageMatrix';
import { SessionDetailDrawer } from '../team-sessions/SessionDetailDrawer';
import { SessionsRegister } from '../team-sessions/SessionsRegister';
import { TeamMembersRegister } from '../team-sessions/TeamMembersRegister';
import { TeamReadinessPanel } from '../team-sessions/TeamReadinessPanel';
import { TeamSessionsBulkActions } from '../team-sessions/TeamSessionsBulkActions';
import { TeamSessionsFilters } from '../team-sessions/TeamSessionsFilters';
import { TeamSessionsHeader } from '../team-sessions/TeamSessionsHeader';
import { TeamSummaryCards } from '../team-sessions/TeamSummaryCards';
import { useLopaTeamSessionDetail, useLopaTeamSessionMutations, useLopaTeamSessions } from '../../hooks/useLopaTeamSessions';

const emptyMember = {
  fullName: '',
  email: '',
  organization: '',
  internalExternal: 'Internal',
  jobTitle: '',
  department: '',
  discipline: '',
  studyRole: '',
  responsibilityDescription: '',
  requiredParticipant: true,
  votingParticipant: false,
  reviewer: false,
  approver: false,
  facilitator: false,
  scribe: false,
  accessLevel: 'View only',
  notes: ''
};

const emptySession = {
  title: '',
  sessionType: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  meetingLink: '',
  facilitatorMemberId: '',
  scribeMemberId: '',
  agendaTemplate: '',
  sendCalendarInvite: true,
  sendNotification: true
};

export function LopaTeamSessionsTab({ id }: { id: string }) {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const query = useLopaTeamSessions(id, filters);
  const mutations = useLopaTeamSessionMutations(id);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<any>(emptyMember);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState<any>(emptySession);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [minutesForm, setMinutesForm] = useState<any>({});

  const data = query.data;
  const selectedSession = useMemo(() => data?.sessions?.rows?.find((row: any) => row.id === selectedSessionId) ?? null, [data, selectedSessionId]);
  const detailQuery = useLopaTeamSessionDetail(id, selectedSessionId);
  const detail = detailQuery.data;
  const readOnly = !!data?.readOnly;
  const canEdit = !readOnly;

  useEffect(() => {
    if (detail?.minutes) {
      setMinutesForm({
        summary: detail.minutes.minutes_summary ?? '',
        discussionNotes: detail.minutes.discussion_notes ?? ''
      });
    }
  }, [detail?.minutes]);

  function openAddMember() {
    setEditingMemberId(null);
    setMemberForm(emptyMember);
    setMemberDialogOpen(true);
  }

  function openEditMember(row: any) {
    setEditingMemberId(row.id);
    setMemberForm({
      userId: row.user_id,
      contactId: row.contact_id,
      fullName: row.full_name ?? '',
      email: row.email ?? '',
      organization: row.organization ?? '',
      internalExternal: row.internal_external ?? 'Internal',
      jobTitle: row.job_title ?? '',
      department: row.department ?? '',
      discipline: row.discipline ?? '',
      studyRole: row.study_role ?? '',
      responsibilityDescription: row.responsibility_description ?? '',
      requiredParticipant: !!row.required_participant,
      votingParticipant: !!row.voting_participant,
      reviewer: !!row.reviewer,
      approver: !!row.approver,
      facilitator: !!row.facilitator,
      scribe: !!row.scribe,
      accessLevel: row.access_level ?? 'View only',
      notes: row.notes ?? ''
    });
    setMemberDialogOpen(true);
  }

  function saveMember() {
    if (editingMemberId) {
      mutations.updateMember.mutate({ memberId: editingMemberId, values: memberForm }, { onSuccess: () => setMemberDialogOpen(false) });
      return;
    }
    mutations.createMember.mutate(memberForm, { onSuccess: () => setMemberDialogOpen(false) });
  }

  function openCreateSession() {
    setEditingSessionId(null);
    setSessionForm(emptySession);
    setSessionDialogOpen(true);
  }

  function openEditSession(row: any) {
    setEditingSessionId(row.id);
    setSessionForm({
      title: row.session_title ?? '',
      sessionType: row.session_type ?? '',
      description: row.description ?? '',
      startTime: toLocalInput(row.start_time),
      endTime: toLocalInput(row.end_time),
      location: row.location ?? '',
      meetingLink: row.meeting_link ?? '',
      facilitatorMemberId: row.facilitator_member_id ?? '',
      scribeMemberId: row.scribe_member_id ?? '',
      agendaTemplate: row.agenda_template ?? '',
      sendCalendarInvite: false,
      sendNotification: true
    });
    setSessionDialogOpen(true);
  }

  function saveSession() {
    if (editingSessionId) {
      mutations.updateSession.mutate({ sessionId: editingSessionId, values: sessionForm }, { onSuccess: () => setSessionDialogOpen(false) });
      return;
    }
    mutations.createSession.mutate(sessionForm, { onSuccess: () => setSessionDialogOpen(false) });
  }

  function removeMember(row: any) {
    const reason = window.prompt(`Reason for removing ${row.full_name}`);
    if (!reason) return;
    mutations.removeMember.mutate({ memberId: row.id, reason });
  }

  function cancelSession(row: any) {
    const reason = window.prompt(`Reason for cancelling ${row.session_title}`);
    if (!reason) return;
    mutations.cancelSession.mutate({ sessionId: row.id, reason });
  }

  function addAgenda() {
    if (!selectedSessionId) return;
    const topic = window.prompt('Agenda topic');
    if (!topic) return;
    mutations.createAgenda.mutate({ sessionId: selectedSessionId, values: { topic, status: 'Open' } });
  }

  function bulkPresent() {
    if (!selectedSessionId || !detail?.attendance) return;
    mutations.updateAttendance.mutate({
      sessionId: selectedSessionId,
      rows: detail.attendance.map((row: any) => ({
        teamMemberId: row.team_member_id,
        requiredAttendee: row.required_attendee,
        attendanceStatus: 'Present',
        notes: row.notes ?? ''
      }))
    });
  }

  function saveMinutes() {
    if (!selectedSessionId) return;
    mutations.updateMinutes.mutate({
      sessionId: selectedSessionId,
      values: {
        minutesSummary: minutesForm.summary,
        discussionNotes: minutesForm.discussionNotes
      }
    });
  }

  function addDecision() {
    if (!selectedSessionId) return;
    const decisionTitle = window.prompt('Decision title');
    if (!decisionTitle) return;
    mutations.createDecision.mutate({ sessionId: selectedSessionId, values: { decisionTitle, decisionType: 'Other', actionRequired: false } });
  }

  function createAction() {
    if (!selectedSessionId) return;
    const title = window.prompt('Universal action title');
    if (!title) return;
    mutations.createAction.mutate({ sessionId: selectedSessionId, values: { title, priority: 'Medium', sourceType: 'Session' } });
  }

  if (query.isLoading) return <State text="Loading LOPA team and session data from API..." />;
  if (query.isError) return <State text="Unable to load Team & Sessions. Check permission, study access, or backend validation." tone="error" />;
  if (!data) return <State text="No Team & Sessions data returned." tone="error" />;

  return (
    <section className="space-y-4">
      {(mutations.createMember.isError || mutations.updateMember.isError || mutations.createSession.isError || mutations.updateSession.isError) ? <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">Team/session action failed. Check required fields, permissions, status, or backend validation.</div> : null}
      <TeamSessionsHeader header={data.header} readOnly={readOnly} onAddMember={openAddMember} onInvite={() => data.members.rows.forEach((row: any) => row.required_participant && row.invitation_status === 'Pending' && mutations.inviteMember.mutate({ memberId: row.id }))} onCreateSession={openCreateSession} onExport={() => mutations.export.mutate()} />
      <TeamSessionsFilters filters={filters} setFilters={setFilters} context={data.context ?? {}} />
      <TeamSummaryCards summary={data.summary} />
      <TeamSessionsBulkActions readOnly={readOnly} onInviteRequired={() => data.members.rows.forEach((row: any) => row.required_participant && mutations.inviteMember.mutate({ memberId: row.id }))} onSyncActions={() => selectedSessionId && mutations.syncActions.mutate(selectedSessionId)} onExport={() => mutations.export.mutate()} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,.75fr)]">
        <div className="space-y-4">
          <LopaPanel title="Team Members Register">
            <TeamMembersRegister rows={data.members.rows} onEdit={openEditMember} onInvite={(row: any) => mutations.inviteMember.mutate({ memberId: row.id })} onRemove={removeMember} />
          </LopaPanel>
          <LopaPanel title="Sessions Register">
            <SessionsRegister rows={data.sessions.rows} onOpen={(row: any) => setSelectedSessionId(row.id)} onEdit={openEditSession} onCancel={cancelSession} onComplete={(row: any) => mutations.completeSession.mutate(row.id)} />
          </LopaPanel>
        </div>
        <div className="space-y-4">
          <RoleDisciplineCoverageMatrix coverage={data.coverage} />
          <InvitationParticipationPanel invitations={data.invitations} />
          <QuorumRequiredRepresentationPanel quorum={data.quorum} />
          <TeamReadinessPanel readiness={data.readiness} />
        </div>
      </div>
      <AddEditTeamMemberDialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} form={memberForm} setForm={setMemberForm} context={data.context ?? {}} onSave={saveMember} saving={mutations.createMember.isPending || mutations.updateMember.isPending} />
      <CreateEditSessionDialog open={sessionDialogOpen} onClose={() => setSessionDialogOpen(false)} form={sessionForm} setForm={setSessionForm} context={data.context ?? {}} members={data.members.rows} onSave={saveSession} saving={mutations.createSession.isPending || mutations.updateSession.isPending} />
      <SessionDetailDrawer
        open={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
        session={selectedSession}
        detail={detail}
        canEdit={canEdit}
        onAddAgenda={addAgenda}
        onBulkPresent={bulkPresent}
        onSaveAttendance={bulkPresent}
        onSaveMinutes={saveMinutes}
        minutesForm={minutesForm}
        setMinutesForm={setMinutesForm}
        onCreateDecision={addDecision}
        onCreateAction={createAction}
        onSyncActions={() => selectedSessionId && mutations.syncActions.mutate(selectedSessionId)}
        onLockMinutes={() => {
          if (!selectedSessionId) return;
          const reason = window.prompt('Reason for locking minutes') ?? undefined;
          mutations.lockMinutes.mutate(reason ? { sessionId: selectedSessionId, reason } : { sessionId: selectedSessionId });
        }}
        onUnlockMinutes={() => {
          if (!selectedSessionId) return;
          const reason = window.prompt('Reason for unlocking minutes');
          if (reason) mutations.unlockMinutes.mutate({ sessionId: selectedSessionId, reason });
        }}
        onComplete={() => selectedSessionId && mutations.completeSession.mutate(selectedSessionId)}
        onCancel={() => selectedSession && cancelSession(selectedSession)}
      />
    </section>
  );
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <div className={`rounded-xl border p-6 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</div>;
}

function toLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
