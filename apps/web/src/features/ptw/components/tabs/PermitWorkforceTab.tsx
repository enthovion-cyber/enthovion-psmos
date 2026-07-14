'use client';

import { Plus, RefreshCcw, ChevronDown, History } from 'lucide-react';
import { useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import type { Permit } from '@/services/ptw.service';
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
      <section className="rounded-xl border border-rose-500/20 bg-slate-900 p-6 text-center shadow-xl">
        <div className="font-bold text-rose-400">Unable to load workforce data.</div>
        <p className="mt-2 text-sm text-slate-400">Refresh the tab or check the PTW API connection.</p>
        <button 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 mx-auto mt-4 transition-all hover:bg-slate-800 active:scale-95" 
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

      {/* Workforce Control Toolbar */}
      <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Workforce Controls</h2>
            <p className="mt-0.5 text-xs text-slate-400">Manage workers, key roles, briefing acknowledgements, sign-in/sign-out, and emergency accountability.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-sky-500 active:scale-95" 
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <Plus size={15} /> Add Worker
            </button>
            <button 
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 active:scale-95" 
              onClick={() => run(() => mutations.bulkBriefing.mutateAsync(undefined), 'All applicable workers briefed')}
            >
              Bulk Briefing
            </button>
            <button 
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 active:scale-95" 
              onClick={() => run(() => mutations.bulkSignIn.mutateAsync(undefined), 'Workers signed in')}
            >
              Bulk Sign-In
            </button>
            <button 
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 active:scale-95" 
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

      {/* Workforce History Section featuring dynamic entry limits */}
      <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Workforce History
            </h3>
          </div>
          <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-300">
            {historyEvents.length} {historyEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {historyEvents.length ? (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-md">
              {displayedHistory.map((event) => (
                <div 
                  key={event.id} 
                  className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3 transition-colors hover:bg-slate-950/80"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-xs text-slate-200 tracking-wide uppercase">
                      {event.event_type}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {event.description}
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-slate-400/80 border-t border-slate-800/30 pt-1.5">
                    Operator ID: <span className="font-mono text-slate-300">{event.user_id ?? 'System'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic View All Toggle Controls */}
            {hasMoreThanThreeEvents && (
              <div className="flex justify-center pt-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold tracking-wide text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 active:scale-98"
                >
                  {showAllHistory ? 'Show Less' : `View All History (${historyEvents.length})`}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showAllHistory ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center text-xs font-medium text-slate-500">
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
        <div key={item} className="rounded-xl border border-slate-800/60 h-32 animate-pulse bg-slate-900/60 shadow-md" />
      ))}
    </div>
  );
}