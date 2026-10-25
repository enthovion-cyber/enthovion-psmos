'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  OpBadge,
  OpButton,
  OpCard,
  OpEmpty,
  OpError,
  OpField,
  OpHeader,
  OpLayout,
  OpLoading,
  OpMetric,
  fmtDate,
  fmtDateTime,
  opInput,
  statusTone
} from '../shared/OpUi';
import {
  useOpExecutions,
  useOpExecutionMutations,
  useOpRegister
} from '../hooks/useOperatingProcedures';
import type { OpExecution } from '../types/operating-procedures.types';

export function OpExecutionListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  // Form state for launching execution
  const [selectedProcId, setSelectedProcId] = useState('');
  const [execMode, setExecMode] = useState('Normal');
  const [shift, setShift] = useState('Day Shift');
  const [crew, setCrew] = useState('Crew A');
  const [linkedPtw, setLinkedPtw] = useState('');
  const [linkedMoc, setLinkedMoc] = useState('');
  const [startError, setStartError] = useState<string | null>(null);

  const { data: executions, isLoading, error, refetch } = useOpExecutions({
    status: statusFilter === 'all' ? undefined : statusFilter,
    executionMode: modeFilter === 'all' ? undefined : modeFilter
  });

  const { data: registerData } = useOpRegister({ limit: 100 });
  const mutations = useOpExecutionMutations();

  const filtered = useMemo(() => {
    if (!executions) return [];
    return executions.filter((ex) => {
      const matchSearch =
        !search ||
        ex.execution_number.toLowerCase().includes(search.toLowerCase()) ||
        ex.title.toLowerCase().includes(search.toLowerCase()) ||
        ex.procedure?.title?.toLowerCase().includes(search.toLowerCase()) ||
        ex.procedure?.procedure_number?.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [executions, search]);

  const metrics = useMemo(() => {
    if (!executions) return { total: 0, inProgress: 0, completed: 0, deviated: 0 };
    return {
      total: executions.length,
      inProgress: executions.filter((e) => e.status === 'In Progress').length,
      completed: executions.filter((e) => e.status === 'Completed').length,
      deviated: executions.filter((e) => e.deviated_steps > 0).length
    };
  }, [executions]);

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartError(null);
    if (!selectedProcId) {
      setStartError('Please select an operating procedure to execute.');
      return;
    }

    try {
      const newRun = await mutations.startExecution.mutateAsync({
        procedureId: selectedProcId,
        data: {
          executionMode: execMode,
          shift,
          crew,
          linkedPtwId: linkedPtw || null,
          linkedMocId: linkedMoc || null
        }
      });
      setIsStartModalOpen(false);
      router.push(`/operating-procedures/execute/${newRun.id}`);
    } catch (err: any) {
      setStartError(err?.message || 'Failed to initialize execution run.');
    }
  };

  return (
    <OpLayout current="Execution Runs & Checklists">
      <div className="space-y-6">
        <OpHeader
          title="Field Execution Runs & Checklists"
          subtitle="Real-time digital procedure execution, step-by-step sign-offs, live Safe Operating Limits (SOL) verification, and shift handovers."
          actions={
            <OpButton variant="primary" onClick={() => setIsStartModalOpen(true)}>
              + Start Digital Execution Run
            </OpButton>
          }
        />

        {/* Top KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OpMetric label="Total Execution Runs" value={metrics.total} tone="neutral" />
          <OpMetric label="Active In-Field" value={metrics.inProgress} tone="warn" />
          <OpMetric label="Successfully Completed" value={metrics.completed} tone="good" />
          <OpMetric label="Runs With SOL Deviations" value={metrics.deviated} tone={metrics.deviated > 0 ? 'danger' : 'neutral'} />
        </div>

        {/* Filter Controls */}
        <OpCard>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Search</label>
              <input
                type="text"
                className={opInput}
                placeholder="Search run #, procedure, or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Status</label>
              <select className={opInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
                <option value="Aborted">Aborted</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Execution Mode</label>
              <select className={opInput} value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                <option value="all">All Modes</option>
                <option value="Startup">Startup</option>
                <option value="Normal">Normal Operation</option>
                <option value="Shutdown">Normal Shutdown</option>
                <option value="Emergency Shutdown">Emergency Shutdown</option>
                <option value="Temporary">Temporary Mode</option>
                <option value="Training">Training / Dry Run</option>
              </select>
            </div>
          </div>
        </OpCard>

        {/* Content list */}
        {isLoading ? (
          <OpLoading rows={5} />
        ) : error ? (
          <OpError error={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <OpEmpty
            title="No Execution Runs Found"
            message="No procedure execution runs match your current filters. Start a new digital execution run to track field operator sign-offs."
            action={
              <OpButton variant="primary" onClick={() => setIsStartModalOpen(true)}>
                Start First Execution Run
              </OpButton>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((run) => {
              const pct = run.total_steps > 0 ? Math.round((run.completed_steps / run.total_steps) * 100) : 0;
              const hasDeviations = run.deviated_steps > 0;
              const isInProgress = run.status === 'In Progress';

              return (
                <div
                  key={run.id}
                  className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-primary/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-primary">{run.execution_number}</span>
                        <OpBadge tone={run.status === 'Completed' ? 'good' : run.status === 'In Progress' ? 'warn' : 'neutral'}>
                          {run.status}
                        </OpBadge>
                        <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--psm-muted)]">
                          {run.execution_mode}
                        </span>
                        {hasDeviations && (
                          <OpBadge tone="danger">{run.deviated_steps} SOL Deviation(s)</OpBadge>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-[var(--psm-fg)]">
                        {run.procedure?.procedure_number}: {run.procedure?.title || run.title}
                      </h3>
                      <p className="text-xs text-[var(--psm-muted)]">
                        Shift: <span className="font-medium text-[var(--psm-fg)]">{run.shift || 'N/A'}</span> &bull; Crew:{' '}
                        <span className="font-medium text-[var(--psm-fg)]">{run.crew || 'N/A'}</span> &bull; Started:{' '}
                        {fmtDateTime(run.started_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-medium text-[var(--psm-muted)]">
                          {run.completed_steps} of {run.total_steps} steps
                        </div>
                        <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
                          <div
                            className={`h-full transition-all ${
                              hasDeviations ? 'bg-amber-500' : run.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-0.5 text-[10px] text-[var(--psm-muted)]">{pct}% complete</div>
                      </div>

                      <Link
                        href={`/operating-procedures/execute/${run.id}`}
                        className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold transition ${
                          isInProgress
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)]'
                        }`}
                      >
                        {isInProgress ? 'Resume Runner' : 'View Execution'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Start Execution Run Modal */}
        {isStartModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[var(--psm-fg)]">Start Digital Execution Run</h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Initialize an interactive field execution checklist from an approved operating procedure.
              </p>

              {startError && (
                <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
                  {startError}
                </div>
              )}

              <form onSubmit={handleStartRun} className="mt-4 space-y-4">
                <OpField label="Select Operating Procedure" required>
                  <select
                    className={opInput}
                    value={selectedProcId}
                    onChange={(e) => setSelectedProcId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Procedure --</option>
                    {registerData?.items?.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.procedure_number}] {p.title} ({p.operating_mode || 'Normal'})
                      </option>
                    ))}
                  </select>
                </OpField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <OpField label="Execution Mode">
                    <select className={opInput} value={execMode} onChange={(e) => setExecMode(e.target.value)}>
                      <option value="Normal">Normal Operation</option>
                      <option value="Startup">Unit Startup</option>
                      <option value="Shutdown">Normal Shutdown</option>
                      <option value="Emergency Shutdown">Emergency Shutdown</option>
                      <option value="Temporary">Temporary Operation</option>
                      <option value="Training">Training / Dry Run</option>
                    </select>
                  </OpField>

                  <OpField label="Shift">
                    <select className={opInput} value={shift} onChange={(e) => setShift(e.target.value)}>
                      <option value="Day Shift">Day Shift (07:00 - 19:00)</option>
                      <option value="Night Shift">Night Shift (19:00 - 07:00)</option>
                      <option value="Swing Shift">Swing Shift</option>
                    </select>
                  </OpField>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <OpField label="Operating Crew">
                    <input
                      type="text"
                      className={opInput}
                      value={crew}
                      onChange={(e) => setCrew(e.target.value)}
                      placeholder="e.g. Crew A, Alpha Team"
                    />
                  </OpField>

                  <OpField label="Linked PTW # (Optional)">
                    <input
                      type="text"
                      className={opInput}
                      value={linkedPtw}
                      onChange={(e) => setLinkedPtw(e.target.value)}
                      placeholder="e.g. PTW-2026-0811"
                    />
                  </OpField>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <OpButton variant="secondary" onClick={() => setIsStartModalOpen(false)}>
                    Cancel
                  </OpButton>
                  <OpButton variant="primary" type="submit" disabled={mutations.startExecution.isPending}>
                    {mutations.startExecution.isPending ? 'Initializing...' : 'Launch Runner'}
                  </OpButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OpLayout>
  );
}
