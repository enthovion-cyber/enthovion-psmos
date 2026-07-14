'use client';

import { useState } from 'react';
import { Plus, Download, Users, Calendar, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopSessionMutations } from '../../hooks/useHazopSessionMutations';
import { useHazopSessions } from '../../hooks/useHazopSessions';
import { useHazopTeam } from '../../hooks/useHazopTeam';
import { useHazopTeamMutations } from '../../hooks/useHazopTeamMutations';
import type { HazopSession, HazopSessionFilters as SessionFilterState } from '../../types/hazop-session.types';
import type { HazopTeamFilters as TeamFilterState, HazopTeamMember } from '../../types/hazop-team.types';
import { AddEditSessionDialog } from '../sessions/AddEditSessionDialog';
import { HazopSessionDetailDrawer } from '../sessions/HazopSessionDetailDrawer';
import { HazopSessionFilters } from '../sessions/HazopSessionFilters';
import { HazopSessionSchedulePanel } from '../sessions/HazopSessionSchedulePanel';
import { AddEditTeamMemberDialog } from '../team/AddEditTeamMemberDialog';
import { HazopDisciplineCoveragePanel } from '../team/HazopDisciplineCoveragePanel';
import { HazopStudyTeamRegister } from '../team/HazopStudyTeamRegister';
import { HazopTeamFilters } from '../team/HazopTeamFilters';
import { HazopTeamMemberDetailDrawer } from '../team/HazopTeamMemberDetailDrawer';
import { HazopTeamSignoffReadinessPanel } from '../team/HazopTeamSignoffReadinessPanel';
import { HazopTeamSummaryCards } from '../team/HazopTeamSummaryCards';

export function HazopTeamSessionsTab({ study }: { study: any }) {
  const [teamFilters, setTeamFilters] = useState<TeamFilterState>({ discipline: 'All', studyRole: 'All', status: 'All', requiredAttendance: 'All' });
  const [sessionFilters, setSessionFilters] = useState<SessionFilterState>({ status: 'All', sessionType: 'All', facilitatorId: 'All', nodeId: 'All' });
  const [editingMember, setEditingMember] = useState<HazopTeamMember | null>(null);
  const [memberDrawer, setMemberDrawer] = useState<HazopTeamMember | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [editingSession, setEditingSession] = useState<HazopSession | null>(null);
  const [sessionDrawer, setSessionDrawer] = useState<HazopSession | null>(null);
  const [addingSession, setAddingSession] = useState(false);
  const permissions = useMyPermissions().data ?? [];
  const can = (permission: string) => permissions.includes(permission) || permissions.includes('hazop:manage');
  const readonly = ['Approved', 'Closed', 'Cancelled'].includes(study.status);
  const team = useHazopTeam(study.id, teamFilters);
  const sessions = useHazopSessions(study.id, sessionFilters);
  const teamMutations = useHazopTeamMutations(study.id);
  const sessionMutations = useHazopSessionMutations(study.id);
  const context = team.context.data ?? {};
  const members = team.members.data ?? [];
  const sessionRows = sessions.sessions.data ?? [];
  const selectedSession = sessionDrawer ? sessionRows.find((row: HazopSession) => row.id === sessionDrawer.id) ?? sessionDrawer : null;

  if (!can('hazop.team.view') && !can('hazop.sessions.view')) {
    return (
      <StateCard 
        tone="red" 
        title="Permission denied" 
        text="You do not have permission to view HAZOP team and sessions." 
      />
    );
  }

  const saveMember = (values: Record<string, any>) => {
    if (editingMember) teamMutations.update.mutate({ memberId: editingMember.id, values }, { onSuccess: () => setEditingMember(null) });
    else teamMutations.create.mutate(values, { onSuccess: () => setAddingMember(false) });
  };
  const saveSession = (values: Record<string, any>) => {
    if (editingSession) sessionMutations.update.mutate({ sessionId: editingSession.id, values }, { onSuccess: () => setEditingSession(null) });
    else sessionMutations.create.mutate(values, { onSuccess: () => setAddingSession(false) });
  };
  const exportReport = async () => {
    const file = await teamMutations.exportReport.mutateAsync();
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.fileName ?? `${study.study_number}-team-sessions.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] p-1 space-y-6 text-slate-100 antialiased">
      {/* Alert Banners System */}
      <div className="space-y-3">
        {readonly && (
          <StateCard 
            tone="amber" 
            title="Read-only Study Archive" 
            text="Approved, closed, and cancelled studies require an authorized re-open before team structures or session parameters can be altered." 
          />
        )}
        {(team.members.isError || sessions.sessions.isError) && (
          <StateCard 
            tone="red" 
            title="Data Sync Interrupted" 
            text="Unable to load Team & Sessions. Please verify migrations, permissions, and active endpoint configurations for HAZOP internal APIs." 
          />
        )}
      </div>

      {/* Modern Dashboard Header */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Team & Sessions Workspace
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Monitor study discipline coverage, evaluate real-time session schedules, log attendance, sign-offs, and track localized actionable items.
          </p>
        </div>
        
        {/* Universal Management Control Group */}
        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
          {can('hazop.sessions.export') && (
            <button 
              onClick={exportReport}
              disabled={teamMutations.exportReport.isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              <Download size={14} />
              {teamMutations.exportReport.isPending ? 'Exporting...' : 'Export Matrix'}
            </button>
          )}
          {can('hazop.team.manage') && !readonly && (
            <button 
              onClick={() => setAddingMember(true)} 
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow active:scale-[0.98]"
            >
              <Plus size={14} />
              Add Team Member
            </button>
          )}
          {can('hazop.sessions.create') && !readonly && (
            <button 
              onClick={() => setAddingSession(true)} 
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow active:scale-[0.98]"
            >
              <Plus size={14} />
              Schedule Session
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Bar */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-850 p-1">
        <HazopTeamSummaryCards 
          summary={team.summary.data} 
          loading={team.summary.isLoading} 
          onFilter={(key) => 
            key === 'missingRequiredDisciplines' 
              ? setTeamFilters({ ...teamFilters, requiredAttendance: 'Yes' }) 
              : key === 'attendanceIncomplete' 
              ? setSessionFilters({ ...sessionFilters, attendanceIncomplete: 'true' }) 
              : undefined
          } 
        />
      </div>

      {/* Main Structural Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
        {/* Left Interactive Panel: Core Registries */}
        <main className="space-y-8 min-w-0">
          
          {/* Section A: Team Management Node */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Users size={16} className="text-indigo-400" />
              <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">Study Team Register</h3>
            </div>
            <HazopTeamFilters 
              filters={teamFilters} 
              context={context} 
              onChange={setTeamFilters} 
              onExport={undefined} /* Moved to primary top command layout */
              exporting={false} 
            />
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
              <HazopStudyTeamRegister 
                rows={members} 
                loading={team.members.isLoading} 
                readonly={readonly} 
                canManage={can('hazop.team.manage')} 
                canRemove={can('hazop.team.remove')} 
                canInvite={can('hazop.team.invite')} 
                onOpen={setMemberDrawer} 
                onEdit={setEditingMember} 
                onInvite={(row) => teamMutations.resendInvite.mutate(row.id)} 
                onRemove={(row) => { 
                  const reason = window.prompt('Removal/replacement reason'); 
                  if (reason !== null) teamMutations.remove.mutate({ memberId: row.id, reason }); 
                }} 
                onDelete={(row) => window.confirm(`Delete ${row.display_name ?? row.name}?`) && teamMutations.delete.mutate(row.id)} 
              />
            </div>
          </section>

          {/* Section B: Session Operations Node */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <Calendar size={16} className="text-emerald-400" />
              <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase">HAZOP Timeline & Sessions</h3>
            </div>
            <HazopSessionFilters 
              filters={sessionFilters} 
              context={context} 
              onChange={setSessionFilters} 
            />
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
              <HazopSessionSchedulePanel 
                rows={sessionRows} 
                loading={sessions.sessions.isLoading} 
                readonly={readonly} 
                canEdit={can('hazop.sessions.edit')} 
                canComplete={can('hazop.sessions.complete')} 
                onOpen={setSessionDrawer} 
                onEdit={setEditingSession} 
                onStart={(row) => sessionMutations.start.mutate(row.id)} 
                onComplete={(row) => sessionMutations.complete.mutate(row.id)} 
                onCancel={(row) => { 
                  const reason = window.prompt('Cancellation reason'); 
                  if (reason !== null) sessionMutations.cancel.mutate({ sessionId: row.id, reason }); 
                }} 
              />
            </div>
          </section>
        </main>

        {/* Right Sticky Sidebar: Matrix Coverage & Readiness Metrics */}
        <aside className="space-y-5 h-fit lg:sticky lg:top-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discipline Coverage</h4>
            <p className="text-xs text-slate-500 pb-2">Assures cross-functional compliance during safety assessments.</p>
            <HazopDisciplineCoveragePanel rows={team.coverage.data ?? []} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sign-off Verification</h4>
            <p className="text-xs text-slate-500 pb-2">Review overall assessment finalization readiness thresholds.</p>
            <HazopTeamSignoffReadinessPanel readiness={team.readiness.data} />
          </div>
        </aside>
      </div>

      {/* Modals & Dialog Execution Layers */}
      <AddEditTeamMemberDialog 
        open={addingMember || Boolean(editingMember)} 
        member={editingMember ?? undefined} 
        context={context} 
        saving={teamMutations.create.isPending || teamMutations.update.isPending} 
        onClose={() => { setAddingMember(false); setEditingMember(null); }} 
        onSave={saveMember} 
      />

      <AddEditSessionDialog 
        open={addingSession || Boolean(editingSession)} 
        session={editingSession ?? undefined} 
        context={context} 
        saving={sessionMutations.create.isPending || sessionMutations.update.isPending} 
        onClose={() => { setAddingSession(false); setEditingSession(null); }} 
        onSave={saveSession} 
      />

      {/* Contextual Sliding Drawers */}
      {memberDrawer && (
        <HazopTeamMemberDetailDrawer 
          member={memberDrawer} 
          readonly={readonly} 
          canManage={can('hazop.team.manage')} 
          onClose={() => setMemberDrawer(null)} 
          onEdit={() => { setEditingMember(memberDrawer); setMemberDrawer(null); }} 
          onInvite={() => teamMutations.resendInvite.mutate(memberDrawer.id)} 
          onRemove={() => teamMutations.remove.mutate({ memberId: memberDrawer.id, reason: 'Removed from detail drawer' })} 
        />
      )}

      {selectedSession && (
        <HazopSessionDetailDrawer 
          session={selectedSession} 
          context={context} 
          readonly={readonly} 
          permissions={{ 
            edit: can('hazop.sessions.edit'), 
            complete: can('hazop.sessions.complete'), 
            cancel: can('hazop.sessions.cancel'), 
            attendance: can('hazop.sessions.attendance.manage'), 
            minutes: can('hazop.sessions.minutes.manage'), 
            decisions: can('hazop.sessions.decisions.manage'), 
            actions: can('hazop.sessions.actions.create') 
          }} 
          onClose={() => setSessionDrawer(null)} 
          onEdit={() => { setEditingSession(selectedSession); setSessionDrawer(null); }} 
          onStart={() => sessionMutations.start.mutate(selectedSession.id)} 
          onComplete={() => sessionMutations.complete.mutate(selectedSession.id)} 
          onCancel={() => sessionMutations.cancel.mutate({ sessionId: selectedSession.id, reason: 'Cancelled from session drawer' })} 
          onMarkAttendance={(values) => sessionMutations.markAttendance.mutate({ sessionId: selectedSession.id, values })} 
          onSaveMinutes={(values, minutesId) => sessionMutations.saveMinutes.mutate(minutesId ? { sessionId: selectedSession.id, minutesId, values } : { sessionId: selectedSession.id, values })} 
          onApproveMinutes={(minutesId) => sessionMutations.approveMinutes.mutate({ sessionId: selectedSession.id, minutesId })} 
          onAddDecision={(values) => sessionMutations.addDecision.mutate({ sessionId: selectedSession.id, values })} 
          onDeleteDecision={(decisionId) => sessionMutations.deleteDecision.mutate({ sessionId: selectedSession.id, decisionId })} 
          onCreateAction={(values) => sessionMutations.createAction.mutate({ sessionId: selectedSession.id, values })} 
          onSyncActions={() => sessionMutations.syncActions.mutate(selectedSession.id)} 
        />
      )}
    </div>
  );
}

function StateCard({ tone, title, text }: { tone: 'red' | 'amber'; title: string; text: string }) {
  const isRed = tone === 'red';
  const Icon = isRed ? ShieldAlert : AlertTriangle;
  const colorStyles = isRed 
    ? 'border-red-500/20 bg-red-950/30 text-red-200' 
    : 'border-amber-500/20 bg-amber-950/30 text-amber-200';

  return (
    <section className={`flex gap-3 items-start rounded-xl border p-4 text-sm backdrop-blur-sm shadow-sm ${colorStyles}`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${isRed ? 'text-red-400' : 'text-amber-400'}`} />
      <div className="space-y-0.5">
        <div className="font-semibold tracking-wide">{title}</div>
        <div className="text-xs opacity-80 leading-relaxed">{text}</div>
      </div>
    </section>
  );
}