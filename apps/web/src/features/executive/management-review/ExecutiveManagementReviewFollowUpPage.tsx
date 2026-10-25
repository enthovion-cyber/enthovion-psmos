'use client';

import React, { useState } from 'react';
import { Clock, CheckSquare, AlertTriangle, ArrowRight, ShieldCheck, Filter } from 'lucide-react';
import { useManagementReviewFollowUp, useManagementReviewMutations } from '../hooks/useExecutiveManagementReview';
import {
  ExecutiveManagementReviewNav,
  ExecutiveManagementReviewHeader,
} from './ExecutiveManagementReviewShared';
import { ExecutiveCommitmentStatusBadge } from './ManagementReviewBadges';
import { ManagementReviewCommitmentAgingChart } from '../components/charts/ManagementReviewCommitmentAgingChart';
import { CarryForwardCommitmentDialog } from './ManagementReviewDialogs';

export function ExecutiveManagementReviewFollowUpPage() {
  const query = useManagementReviewFollowUp();
  const mutations = useManagementReviewMutations();

  const [selectedCarryForwardCommitment, setSelectedCarryForwardCommitment] = useState<any | null>(null);

  const data = query.data;
  const rows = data?.rows ?? [];

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Leadership Follow-Up & Commitment Tracker"
        subtitle="Active oversight of management review obligations, aging backlog, and independent closure verifications."
      />

      {/* Aging Infographic Chart */}
      <ManagementReviewCommitmentAgingChart
        totalCommitments={data?.totalCommitments ?? 0}
        openCommitments={data?.openCommitments ?? 0}
        overdueCommitments={data?.overdueCommitments ?? 0}
        pendingVerificationCount={data?.pendingVerificationCount ?? 0}
        aging={data?.aging}
      />

      {/* Commitments Requiring Follow-Up Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500/10 p-1.5 text-amber-500">
              <Clock size={16} />
            </span>
            <h3 className="text-sm font-bold text-[var(--psm-text)]">Active Follow-Up Obligations</h3>
          </div>
          <span className="text-xs font-semibold text-[var(--psm-muted)]">{rows.length} Commitments</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="pb-3">Commitment Title / Code</th>
                <th className="pb-3">Responsible Owner</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Action Engine Status</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.length > 0 ? (
                rows.map((c) => (
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
                      {c.universal_action_id ? (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                          Synced
                        </span>
                      ) : (
                        <span className="rounded bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-[var(--psm-muted)]">
                          Not Created
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <ExecutiveCommitmentStatusBadge status={c.commitment_status} />
                    </td>
                    <td className="py-3 text-right space-x-1.5">
                      {!c.universal_action_id && (
                        <button
                          onClick={() => mutations.createAction.mutate(c.id)}
                          disabled={mutations.createAction.isPending}
                          className="rounded bg-[var(--psm-primary)] px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                        >
                          Create Action
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCarryForwardCommitment(c)}
                        className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-[var(--psm-surface-2)]"
                      >
                        Carry Forward
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--psm-muted)]">
                    No active commitments require follow-up.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCarryForwardCommitment && (
        <CarryForwardCommitmentDialog
          isOpen={Boolean(selectedCarryForwardCommitment)}
          onClose={() => setSelectedCarryForwardCommitment(null)}
          commitmentId={selectedCarryForwardCommitment.id}
          commitmentTitle={selectedCarryForwardCommitment.commitment_title}
        />
      )}
    </main>
  );
}
