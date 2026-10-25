'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
  criticalityTone,
  fmtDate,
  fmtDateTime,
  formatOpError,
  opInput,
  statusTone
} from '../shared/OpUi';
import {
  useOpChangeFlags,
  useOpChangeFlagMutations
} from '../hooks/useOperatingProcedures';
import type { OpChangeFlag } from '../types/operating-procedures.types';

export function OpChangeFlagsPage() {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [resolvingFlag, setResolvingFlag] = useState<OpChangeFlag | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [dismissingFlag, setDismissingFlag] = useState<OpChangeFlag | null>(null);
  const [dismissalReason, setDismissalReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: flags, isLoading, error, refetch } = useOpChangeFlags({
    sourceType: sourceFilter === 'all' ? undefined : sourceFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter
  });

  const mutations = useOpChangeFlagMutations();

  const filtered = useMemo(() => {
    if (!flags) return [];
    return flags.filter((f) => {
      const q = search.toLowerCase();
      return (
        !search ||
        f.source_reference.toLowerCase().includes(q) ||
        f.reason.toLowerCase().includes(q) ||
        f.procedure?.procedure_number.toLowerCase().includes(q) ||
        f.procedure?.title.toLowerCase().includes(q)
      );
    });
  }, [flags, search]);

  const metrics = useMemo(() => {
    if (!flags) return { totalOpen: 0, critical: 0, mocBlockers: 0, resolved: 0 };
    return {
      totalOpen: flags.filter((f) => f.status === 'Open' || f.status === 'In Progress').length,
      critical: flags.filter((f) => (f.priority === 'Critical' || f.priority === 'High') && f.status === 'Open').length,
      mocBlockers: flags.filter((f) => f.blocks_moc_closure && (f.status === 'Open' || f.status === 'In Progress')).length,
      resolved: flags.filter((f) => f.status === 'Resolved').length
    };
  }, [flags]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingFlag) return;
    setActionError(null);
    try {
      await mutations.resolveChangeFlag.mutateAsync({
        flagId: resolvingFlag.id,
        data: { resolutionNotes }
      });
      setResolvingFlag(null);
      setResolutionNotes('');
      refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  const handleDismissSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissingFlag) return;
    setActionError(null);
    try {
      await mutations.dismissChangeFlag.mutateAsync({
        flagId: dismissingFlag.id,
        data: { dismissalReason }
      });
      setDismissingFlag(null);
      setDismissalReason('');
      refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  return (
    <OpLayout current="Change Flags Inbox">
      <div className="space-y-6">
        <OpHeader
          title="Procedure Change Flags & Upstream Links"
          subtitle="Procedures flagged for mandatory revision by Management of Change (MOC), Process Safety Information (PSI), HAZOP/LOPA recommendations, or Incident CAPAs."
        />

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OpMetric label="Open Change Flags" value={metrics.totalOpen} tone={metrics.totalOpen > 0 ? 'warn' : 'good'} />
          <OpMetric label="High / Critical Flags" value={metrics.critical} tone={metrics.critical > 0 ? 'danger' : 'neutral'} />
          <OpMetric label="MOC Closure Blockers" value={metrics.mocBlockers} tone={metrics.mocBlockers > 0 ? 'danger' : 'good'} />
          <OpMetric label="Resolved Flags" value={metrics.resolved} tone="neutral" />
        </div>

        {/* Filters */}
        <OpCard>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Search</label>
              <input
                type="text"
                className={opInput}
                placeholder="Search reference, reason, or procedure..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Source Type</label>
              <select className={opInput} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                <option value="all">All Sources</option>
                <option value="MOC">MOC (Management of Change)</option>
                <option value="PSI">PSI (Safe Operating Limits / P&ID)</option>
                <option value="HAZOP">HAZOP / PHA Recommendation</option>
                <option value="LOPA">LOPA Safeguard / Action</option>
                <option value="INCIDENT">Incident / Near-Miss CAPA</option>
                <option value="AUDIT">Compliance Audit Finding</option>
                <option value="MANUAL">Manual Engineer Request</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Status</label>
              <select className={opInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Open">Open (Pending Revision)</option>
                <option value="In Progress">In Progress (Revision Drafted)</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Priority</label>
              <select className={opInput} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </OpCard>

        {actionError && <OpError error={actionError} />}

        {/* Change Flags List */}
        {isLoading ? (
          <OpLoading rows={6} />
        ) : error ? (
          <OpError error={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <OpEmpty
            title="No Procedure Change Flags"
            message="No operating procedures currently have open change flags matching your filters. MOC, PSI, and HAZOP integrations will automatically flag procedures when upstream changes occur."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((flag) => {
              const isOpen = flag.status === 'Open' || flag.status === 'In Progress';
              return (
                <div
                  key={flag.id}
                  className={`rounded-2xl border p-4 shadow-sm transition ${
                    flag.blocks_moc_closure && isOpen
                      ? 'border-danger/30 bg-danger/5'
                      : 'border-[var(--psm-line)] bg-[var(--psm-surface)]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
                          {flag.source_type}: {flag.source_reference}
                        </span>
                        <OpBadge tone={criticalityTone(flag.priority)}>
                          {flag.priority} Priority
                        </OpBadge>
                        <OpBadge tone={statusTone(flag.status)}>
                          {flag.status}
                        </OpBadge>
                        {flag.blocks_moc_closure && isOpen && (
                          <span className="rounded bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger border border-danger/30">
                            BLOCKS MOC CLOSURE
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[var(--psm-fg)]">
                        <Link
                          href={`/operating-procedures/${flag.procedure_id}`}
                          className="hover:text-primary transition underline decoration-dotted"
                        >
                          {flag.procedure?.procedure_number}: {flag.procedure?.title}
                        </Link>
                      </h3>

                      <p className="text-sm text-[var(--psm-fg)] font-medium">
                        {flag.reason}
                      </p>
                      {flag.description && (
                        <p className="text-xs text-[var(--psm-muted)]">
                          {flag.description}
                        </p>
                      )}

                      <div className="text-[11px] text-[var(--psm-muted)] pt-1">
                        Flagged: {fmtDateTime(flag.created_at)}
                        {flag.resolved_at && ` &bull; Resolved: ${fmtDateTime(flag.resolved_at)}`}
                        {flag.dismissal_reason && ` &bull; Dismissed Reason: ${flag.dismissal_reason}`}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <OpButton
                        variant="secondary"
                        href={`/operating-procedures/${flag.procedure_id}`}
                      >
                        Open Procedure
                      </OpButton>
                      {isOpen && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setResolvingFlag(flag);
                              setResolutionNotes('');
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                          >
                            Mark Resolved
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDismissingFlag(flag);
                              setDismissalReason('');
                            }}
                            className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs font-semibold text-[var(--psm-muted)] hover:text-danger"
                          >
                            Dismiss...
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolve Modal */}
        {resolvingFlag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
              <h3 className="text-base font-bold text-[var(--psm-fg)]">Resolve Procedure Change Flag</h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Confirm that the operating procedure has been revised and satisfies the requirements from {resolvingFlag.source_reference}.
              </p>

              <form onSubmit={handleResolveSubmit} className="mt-4 space-y-4">
                <OpField label="Resolution Notes / Verification Justification" required>
                  <textarea
                    rows={3}
                    className={opInput}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="e.g. Procedure Rev 2.0 published with revised operating temperature limit of 140°C."
                    required
                  />
                </OpField>

                <div className="flex justify-end gap-2 pt-2">
                  <OpButton variant="secondary" onClick={() => setResolvingFlag(null)}>
                    Cancel
                  </OpButton>
                  <button
                    type="submit"
                    disabled={mutations.resolveChangeFlag.isPending}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    {mutations.resolveChangeFlag.isPending ? 'Resolving...' : 'Resolve & Close Flag'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dismiss Modal */}
        {dismissingFlag && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
              <h3 className="text-base font-bold text-[var(--psm-fg)]">Dismiss Procedure Change Flag</h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Provide technical safety justification for why this flagged change is not applicable or requires no procedure update.
              </p>

              <form onSubmit={handleDismissSubmit} className="mt-4 space-y-4">
                <OpField label="Documented Technical Justification" required>
                  <textarea
                    rows={3}
                    className={opInput}
                    value={dismissalReason}
                    onChange={(e) => setDismissalReason(e.target.value)}
                    placeholder="e.g. Engineering review determined change only affects instrumentation wiring without operational step impact."
                    required
                  />
                </OpField>

                <div className="flex justify-end gap-2 pt-2">
                  <OpButton variant="secondary" onClick={() => setDismissingFlag(null)}>
                    Cancel
                  </OpButton>
                  <button
                    type="submit"
                    disabled={mutations.dismissChangeFlag.isPending}
                    className="rounded-lg bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger/90"
                  >
                    {mutations.dismissChangeFlag.isPending ? 'Dismissing...' : 'Confirm Dismissal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OpLayout>
  );
}
