'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, Filter, UserCheck, ShieldCheck, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import {
  useManagementReviewRegister,
  useManagementReviewCommitment,
  useManagementReviewMutations,
} from '../hooks/useExecutiveManagementReview';
import {
  ExecutiveManagementReviewNav,
  ExecutiveManagementReviewHeader,
} from './ExecutiveManagementReviewShared';
import { ExecutiveCommitmentStatusBadge } from './ManagementReviewBadges';
import {
  CreateManagementCommitmentDialog,
  CarryForwardCommitmentDialog,
} from './ManagementReviewDialogs';

export function ExecutiveManagementReviewCommitmentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [carryForwardDialogOpen, setCarryForwardDialogOpen] = useState(false);

  const query = useManagementReviewRegister('commitments', statusFilter ? { status: statusFilter } : undefined);
  const mutations = useManagementReviewMutations();

  const commitmentDetailQuery = useManagementReviewCommitment(selectedCommitmentId || '');

  const rows = (query.data as any)?.rows ?? (Array.isArray(query.data) ? query.data : []);
  const detail = commitmentDetailQuery.data?.commitment;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Management Commitments Register"
        subtitle="Track leadership action obligations, owner accountability, and synchronize with Universal Action Engine."
        actions={
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
          >
            <Plus size={14} /> New Commitment
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
        <div className="flex items-center gap-2 text-xs">
          <Filter size={14} className="text-[var(--psm-muted)]" />
          <span className="font-semibold text-[var(--psm-text)]">Status:</span>
          <select
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs text-[var(--psm-text)]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-[var(--psm-muted)]">{rows.length} Commitments</span>
      </div>

      {/* Commitments Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="pb-3">Commitment Code / Title</th>
                <th className="pb-3">Owner</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.length > 0 ? (
                rows.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="py-3 font-semibold text-[var(--psm-text)]">
                      <div>{c.commitment_title}</div>
                      <div className="font-mono text-[10px] text-[var(--psm-muted)]">{c.commitment_code}</div>
                    </td>
                    <td className="py-3 text-[var(--psm-text)] font-medium">{c.owner_user_id}</td>
                    <td className="py-3">
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">
                      {c.effective_due_at ? new Date(c.effective_due_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3">
                      <ExecutiveCommitmentStatusBadge status={c.commitment_status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedCommitmentId(c.id)}
                        className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-primary)] hover:bg-[var(--psm-surface-2)]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--psm-muted)]">
                    No management commitments recorded for this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Commitment Detail Modal */}
      {selectedCommitmentId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
            <header className="flex items-center justify-between border-b border-[var(--psm-line)] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <ExecutiveCommitmentStatusBadge status={detail.commitment_status} />
                  <span className="font-mono text-xs text-[var(--psm-muted)]">{detail.commitment_code}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-[var(--psm-text)]">{detail.commitment_title}</h3>
              </div>
              <button
                onClick={() => setSelectedCommitmentId(null)}
                className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--psm-surface-2)]"
              >
                Close
              </button>
            </header>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-5 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                {!detail.universal_action_id ? (
                  <button
                    onClick={() => mutations.createAction.mutate(detail.id)}
                    disabled={mutations.createAction.isPending}
                    className="flex items-center gap-1 rounded bg-[var(--psm-primary)] px-3 py-1.5 font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                  >
                    <CheckSquare size={13} />
                    {mutations.createAction.isPending ? 'Creating Action...' : 'Create in Action Engine'}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-emerald-500 font-bold border border-emerald-500/20">
                    <CheckSquare size={13} /> Linked to Universal Action: {detail.universal_action_id}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    mutations.requestCommitmentVerification.mutate({
                      id: detail.id,
                      criteria: 'Confirm hardware installation and functional test pass',
                    })
                  }
                  className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1.5 font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
                >
                  Request Verification
                </button>
                <button
                  onClick={() => setCarryForwardDialogOpen(true)}
                  className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1.5 font-semibold text-amber-600 dark:text-amber-400 hover:bg-[var(--psm-surface-2)]"
                >
                  Carry Forward
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-4 space-y-2">
                <h5 className="font-bold text-[var(--psm-text)]">Obligation Deliverable</h5>
                <p className="text-[var(--psm-muted)]">{detail.commitment_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-[var(--psm-line)] p-3">
                  <span className="text-[var(--psm-muted)]">Responsible Owner:</span>
                  <p className="font-bold text-[var(--psm-text)] mt-0.5">{detail.owner_user_id}</p>
                </div>
                <div className="rounded-lg border border-[var(--psm-line)] p-3">
                  <span className="text-[var(--psm-muted)]">Target Completion Due Date:</span>
                  <p className="font-bold text-[var(--psm-text)] mt-0.5">
                    {detail.effective_due_at ? new Date(detail.effective_due_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {createDialogOpen && (
        <CreateManagementCommitmentDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        />
      )}
      {carryForwardDialogOpen && selectedCommitmentId && detail && (
        <CarryForwardCommitmentDialog
          isOpen={carryForwardDialogOpen}
          onClose={() => setCarryForwardDialogOpen(false)}
          commitmentId={selectedCommitmentId}
          commitmentTitle={detail.commitment_title}
        />
      )}
    </main>
  );
}
