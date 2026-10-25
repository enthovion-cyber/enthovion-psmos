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
  fmtDate,
  fmtDateTime,
  formatOpError,
  opInput,
  statusTone
} from '../shared/OpUi';
import {
  useOpAcknowledgmentMutations,
  useOpAcknowledgments
} from '../hooks/useOperatingProcedures';
import type { OpAcknowledgmentRecord } from '../types/operating-procedures.types';

export function OpAcknowledgmentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [search, setSearch] = useState('');

  // Sign drawer / modal
  const [signingRecord, setSigningRecord] = useState<OpAcknowledgmentRecord | null>(null);
  const [attestationConfirmed, setAttestationConfirmed] = useState(false);
  const [customAttestation, setCustomAttestation] = useState(
    'I certify that I have read, understood, and will strictly adhere to this operating procedure during all field execution activities (OSHA 1910.119(f)(4)).'
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: records, isLoading, error, refetch } = useOpAcknowledgments({
    status: statusFilter === 'all' ? undefined : statusFilter
  });

  const mutations = useOpAcknowledgmentMutations();

  const filtered = useMemo(() => {
    if (!records) return [];
    return records.filter((r) => {
      const q = search.toLowerCase();
      return (
        !search ||
        r.worker?.name.toLowerCase().includes(q) ||
        r.worker?.email.toLowerCase().includes(q) ||
        r.procedure_id.toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const metrics = useMemo(() => {
    if (!records) return { total: 0, acknowledged: 0, pending: 0, overdue: 0, pct: 100 };
    const total = records.length;
    const acknowledged = records.filter((r) => r.status === 'Acknowledged').length;
    const pending = records.filter((r) => r.status === 'Pending').length;
    const overdue = records.filter((r) => r.status === 'Overdue').length;
    const pct = total > 0 ? Math.round((acknowledged / total) * 100) : 100;
    return { total, acknowledged, pending, overdue, pct };
  }, [records]);

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingRecord || !attestationConfirmed) return;
    setActionError(null);

    try {
      await mutations.signAcknowledgment.mutateAsync({
        recordId: signingRecord.id,
        data: {
          attestationStatement: customAttestation
        }
      });
      setSigningRecord(null);
      setAttestationConfirmed(false);
      refetch();
    } catch (err) {
      setActionError(formatOpError(err));
    }
  };

  return (
    <OpLayout current="Read-and-Understand Acknowledgment">
      <div className="space-y-6">
        <OpHeader
          title="Read-and-Understand Acknowledgment (OSHA 1910.119(f)(4))"
          subtitle="Electronic signature capture ensuring operating personnel and affected workers have read, understood, and agreed to adhere to current procedure revisions before field execution."
        />

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OpMetric label="Total Assigned" value={metrics.total} tone="neutral" />
          <OpMetric label="Compliance Rate" value={`${metrics.pct}%`} tone={metrics.pct >= 90 ? 'good' : 'warn'} />
          <OpMetric label="Pending Signatures" value={metrics.pending} tone={metrics.pending > 0 ? 'warn' : 'good'} />
          <OpMetric label="Overdue Acknowledgment" value={metrics.overdue} tone={metrics.overdue > 0 ? 'danger' : 'neutral'} />
        </div>

        {/* Filters */}
        <OpCard>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Search Worker / Procedure</label>
              <input
                type="text"
                className={opInput}
                placeholder="Search worker name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--psm-muted)] uppercase tracking-wider block mb-1">Status</label>
              <select className={opInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Pending">Pending (Action Required)</option>
                <option value="Acknowledged">Acknowledged & Signed</option>
                <option value="Overdue">Overdue</option>
                <option value="Waived">Waived</option>
              </select>
            </div>
          </div>
        </OpCard>

        {actionError && <OpError error={actionError} />}

        {/* Table */}
        {isLoading ? (
          <OpLoading rows={6} />
        ) : error ? (
          <OpError error={error} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <OpEmpty
            title="No Acknowledgment Records Found"
            message="No procedure acknowledgment assignments match your current filters. When new procedure revisions are published, assignments are automatically distributed to affected operating personnel."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                  <tr>
                    <th className="px-4 py-3">Operating Worker</th>
                    <th className="px-4 py-3">Procedure & Revision</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Signed Timestamp</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)]">
                  {filtered.map((r) => {
                    const isPending = r.status === 'Pending' || r.status === 'Overdue';
                    return (
                      <tr key={r.id} className="transition hover:bg-[var(--psm-surface-2)]/60">
                        <td className="px-4 py-3 font-semibold text-[var(--psm-fg)]">
                          {r.worker?.name || 'Assigned Operator'}
                          <span className="block text-[10px] font-normal text-[var(--psm-muted)]">
                            {r.worker?.email || r.worker_user_id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/operating-procedures/${r.procedure_id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            Procedure Reference
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[var(--psm-muted)] font-mono">
                          {fmtDate(r.due_date)}
                        </td>
                        <td className="px-4 py-3">
                          <OpBadge tone={r.status === 'Acknowledged' ? 'good' : r.status === 'Overdue' ? 'danger' : 'warn'}>
                            {r.status}
                          </OpBadge>
                        </td>
                        <td className="px-4 py-3 text-[var(--psm-muted)]">
                          {fmtDateTime(r.acknowledged_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                setSigningRecord(r);
                                setAttestationConfirmed(false);
                              }}
                              className="rounded-lg bg-primary px-3 py-1.5 font-bold text-white shadow-sm hover:bg-primary/90"
                            >
                              Sign & Acknowledge
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* E-Signature Modal */}
        {signingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-xl">
              <h3 className="text-lg font-bold text-[var(--psm-fg)]">
                Electronic Read-and-Understand Acknowledgment
              </h3>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                OSHA 29 CFR 1910.119(f)(4) & (g) Digital Signature Capture
              </p>

              <div className="mt-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs space-y-1">
                <div>Signer: <span className="font-semibold text-[var(--psm-fg)]">{signingRecord.worker?.name || 'Operator'}</span></div>
                <div>Due Date: <span className="font-mono text-primary">{fmtDate(signingRecord.due_date)}</span></div>
              </div>

              <form onSubmit={handleSignSubmit} className="mt-4 space-y-4">
                <OpField label="Attestation Statement">
                  <textarea
                    rows={3}
                    className={opInput}
                    value={customAttestation}
                    onChange={(e) => setCustomAttestation(e.target.value)}
                    required
                  />
                </OpField>

                <label className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-[var(--psm-fg)] cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-[var(--psm-line)]"
                    checked={attestationConfirmed}
                    onChange={(e) => setAttestationConfirmed(e.target.checked)}
                    required
                  />
                  <span>
                    I legally confirm under 21 CFR Part 11 / OSHA PSM that I have accessed, reviewed, and understood all steps, Safe Operating Limits, and emergency corrective actions for this procedure.
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <OpButton variant="secondary" onClick={() => setSigningRecord(null)}>
                    Cancel
                  </OpButton>
                  <button
                    type="submit"
                    disabled={!attestationConfirmed || mutations.signAcknowledgment.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    {mutations.signAcknowledgment.isPending ? 'Signing...' : 'Submit E-Signature'}
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
