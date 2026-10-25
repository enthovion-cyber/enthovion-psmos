'use client';

import { Plus, RefreshCcw, ChevronDown, History, ShieldAlert, ShieldCheck, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { Permit, WorkforceCompetencyResult } from '@/services/ptw.service';
import { ptwService } from '@/services/ptw.service';
import { usePermitBriefings, usePermitWorkforce, usePermitWorkforceHistory, usePermitWorkforceRequiredRoles, usePermitWorkforceSummary } from '../../hooks/usePermitWorkforce';
import { usePermitWorkforceMutations } from '../../hooks/usePermitWorkforceMutations';
import type { WorkerValues } from '../../schemas/workforce.schema';
import type { PermitWorkerRecord } from '../../services/ptw-workforce.service';
import { BriefingPanel } from '../workforce/BriefingPanel';
import { EmergencyAccountabilityPanel } from '../workforce/EmergencyAccountabilityPanel';
import { KeyRolesPanel } from '../workforce/KeyRolesPanel';
import { WorkforceBlockerBanner } from '../workforce/WorkforceBlockerBanner';
import { WorkforceRosterTable } from '../workforce/WorkforceRosterTable';
import { WorkforceSummaryCard } from '../workforce/WorkforceSummaryCard';
import { WorkerForm } from '../workforce/WorkerForm';

export function PermitWorkforceTab({ permit }: { permit: Permit }) {
  const workforce = usePermitWorkforce(permit.id);
  const summary = usePermitWorkforceSummary(permit.id);
  const roles = usePermitWorkforceRequiredRoles(permit.id);
  const briefings = usePermitBriefings(permit.id);
  const history = usePermitWorkforceHistory(permit.id);
  const mutations = usePermitWorkforceMutations(permit.id);
  const toast = useMutationToast();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PermitWorkerRecord | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [competencyResult, setCompetencyResult] = useState<WorkforceCompetencyResult | null>(null);
  const [checkingCompetency, setCheckingCompetency] = useState(false);

  async function handleAuditCompetency() {
    try {
      setCheckingCompetency(true);
      const res = await ptwService.workforceCompetencyCheck(permit.id);
      setCompetencyResult(res);
      if (res.cleared) {
        toast.success(`Competency audit passed: All ${res.workers.length} workers certified for their assigned roles.`);
      } else {
        toast.error(`Competency Gate Blocker: ${res.violations.length} workers fail required training certifications.`);
      }
    } catch (err: any) {
      toast.error('Competency check failed', err?.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setCheckingCompetency(false);
    }
  }

  async function run(work: () => Promise<unknown>, success: string) {
    try {
      const result = await work();
      toast.success(success);
      return result;
    } catch (error) {
      toast.error('Workforce action failed', error instanceof Error ? error.message : 'Request failed');
      return null;
    }
  }

  async function save(values: WorkerValues) {
    if (editing) await run(() => mutations.update.mutateAsync({ id: editing.id, input: values }), 'Worker updated');
    else await run(() => mutations.create.mutateAsync(values), 'Worker added');
    setShowForm(false);
    setEditing(null);
  }

  if (workforce.isLoading || summary.isLoading || roles.isLoading) return <LoadingSkeleton />;

  if (workforce.isError || summary.isError || roles.isError) {
    return (
      <section className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-slate-900 p-6 text-center shadow-sm">
        <div className="font-bold text-rose-700 dark:text-rose-400">Unable to load workforce data.</div>
        <p className="mt-2 text-xs text-slate-500">Refresh the tab or check the PTW API connection.</p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mx-auto mt-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 shadow-xs"
          onClick={() => { workforce.refetch(); summary.refetch(); roles.refetch(); briefings.refetch(); }}
        >
          <RefreshCcw size={15} /> Retry Connection
        </button>
      </section>
    );
  }

  const historyEvents = history.data ?? [];
  const displayedHistory = showAllHistory ? historyEvents : historyEvents.slice(0, 3);
  const hasMoreThanThreeEvents = historyEvents.length > 3;

  const competencyMap: Record<string, { compliant: boolean; missingOrExpiredCerts: string[] }> = {};
  if (competencyResult?.workers) {
    for (const w of competencyResult.workers) {
      if (w.userId) competencyMap[w.userId] = { compliant: w.compliant, missingOrExpiredCerts: w.missingOrExpiredCerts };
      if (w.workerName) competencyMap[w.workerName] = { compliant: w.compliant, missingOrExpiredCerts: w.missingOrExpiredCerts };
    }
  }

  return (
    <div className="space-y-4">
      <WorkforceSummaryCard summary={summary.data} />

      <WorkforceBlockerBanner
        title="Activation Blocker"
        blockers={summary.data?.activationBlockers ?? []}
        clearText="Workforce controls are clear for activation."
      />

      <WorkforceBlockerBanner
        title="Closure Blocker"
        blockers={summary.data?.closureBlockers ?? []}
        clearText="Workforce controls are clear for closure."
      />

      {/* Competency Audit Gate Banner */}
      {competencyResult && (
        competencyResult.cleared ? (
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                  Competency Gate Cleared · OSHA 1910.119 Compliant
                </h3>
                <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  All {competencyResult.workers.length} assigned personnel hold valid, active training credentials for their high-risk roles.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-400/40 bg-rose-500/20 text-rose-700 dark:text-rose-300">
                <ShieldAlert size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200">
                  Competency Gate Blocker: {competencyResult.violations.length} Workers Missing Required Certifications
                </h3>
                <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                  Permit issue and activation are locked until the following workers obtain active certifications or qualified substitutes are assigned:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-rose-800 dark:text-rose-200 font-mono">
                  {competencyResult.violations.map((v: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                      {v}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      )}

      {/* Workforce Control Toolbar */}
      <section className="rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm text-slate-900 dark:text-slate-100 transition-all">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">Workforce Controls</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Manage workers, key roles, briefing acknowledgements, sign-in/sign-out, and emergency accountability.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-all hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 disabled:opacity-50"
              onClick={handleAuditCompetency}
              disabled={checkingCompetency}
            >
              <UserCheck size={15} className="text-indigo-600 dark:text-indigo-400" />
              {checkingCompetency ? 'Auditing Certifications...' : 'Audit Competency Gate'}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-action-primary-hover active:scale-95"
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <Plus size={15} /> Add Worker
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 shadow-xs"
              onClick={() => run(() => mutations.bulkBriefing.mutateAsync(undefined), 'All applicable workers briefed')}
            >
              Bulk Briefing
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 shadow-xs"
              onClick={() => run(() => mutations.bulkSignIn.mutateAsync(undefined), 'Workers signed in')}
            >
              Bulk Sign-In
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 shadow-xs"
              onClick={() => run(() => mutations.bulkSignOut.mutateAsync(undefined), 'Workers signed out')}
            >
              Bulk Sign-Out
            </button>
          </div>
        </div>
      </section>

      {showForm ? (
        <WorkerForm
          editing={editing}
          saving={mutations.create.isPending || mutations.update.isPending}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSubmit={save}
        />
      ) : null}

      <KeyRolesPanel roles={roles.data ?? []} />

      <WorkforceRosterTable
        workers={workforce.data ?? []}
        competencyResults={competencyMap}
        onEdit={(worker) => { setEditing(worker); setShowForm(true); }}
        onDelete={(id) => {
          if (window.confirm('Delete this workforce record? This action is irreversible and audited.')) {
            run(() => mutations.remove.mutateAsync(id), 'Worker deleted');
          }
        }}
        onBriefing={(id) => run(() => mutations.completeBriefing.mutateAsync(id), 'Briefing acknowledged')}
        onSignIn={(id) => run(() => mutations.signIn.mutateAsync(id), 'Worker signed in')}
        onSignOut={(id) => run(() => mutations.signOut.mutateAsync(id), 'Worker signed out')}
      />

      <BriefingPanel
        workers={workforce.data ?? []}
        briefings={briefings.data ?? []}
        onCreate={(values) => run(() => mutations.createBriefing.mutateAsync(values), 'Briefing saved')}
        onBulkBriefing={() => run(() => mutations.bulkBriefing.mutateAsync(undefined), 'All applicable workers briefed')}
      />

      <EmergencyAccountabilityPanel
        summary={summary.data}
        onCheck={() => run(() => mutations.accountabilityCheck.mutateAsync('Accountability check from Workforce tab'), 'Accountability check completed')}
      />

      {/* Workforce History Section */}
      <section className="rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm text-slate-900 dark:text-slate-100 transition-all">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-primary dark:text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Workforce History
            </h3>
          </div>
          <span className="rounded-full border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-950 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            {historyEvents.length} {historyEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {historyEvents.length ? (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {displayedHistory.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40 p-3 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-950/80"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 tracking-wide uppercase">
                      {event.event_type}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {event.description}
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-slate-400 border-t border-slate-200 dark:border-slate-800/30 pt-1.5">
                    Operator ID: <span className="font-mono text-slate-700 dark:text-slate-300">{event.user_id ?? 'System'}</span>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreThanThreeEvents && (
              <div className="flex justify-center pt-2 border-t border-slate-100 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 shadow-xs"
                >
                  {showAllHistory ? 'Show Less' : `View All History (${historyEvents.length})`}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showAllHistory ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-6 text-center text-xs font-medium text-slate-500">
            No workforce historical log updates assigned to this permit.
          </div>
        )}
      </section>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl border border-slate-200 dark:border-slate-800/60 h-32 animate-pulse bg-slate-100 dark:bg-slate-900/60 shadow-xs" />
      ))}
    </div>
  );
}
