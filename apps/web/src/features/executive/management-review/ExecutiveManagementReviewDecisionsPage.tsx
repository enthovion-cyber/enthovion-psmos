'use client';

import React, { useState } from 'react';
import { Sparkles, Plus, Filter, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, CheckSquare } from 'lucide-react';
import {
  useManagementReviewRegister,
  useManagementReviewDecision,
  useManagementReviewMutations,
} from '../hooks/useExecutiveManagementReview';
import {
  ExecutiveManagementReviewNav,
  ExecutiveManagementReviewHeader,
} from './ExecutiveManagementReviewShared';
import { ExecutiveDecisionStatusBadge } from './ManagementReviewBadges';
import { RecordExecutiveDecisionDialog, CreateManagementCommitmentDialog } from './ManagementReviewDialogs';

export function ExecutiveManagementReviewDecisionsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commitmentDialogOpen, setCommitmentDialogOpen] = useState(false);

  const query = useManagementReviewRegister('decisions', statusFilter ? { status: statusFilter } : undefined);
  const mutations = useManagementReviewMutations();

  const decisionDetailQuery = useManagementReviewDecision(selectedDecisionId || '');

  const rows = (query.data as any)?.rows ?? (Array.isArray(query.data) ? query.data : []);
  const detail = decisionDetailQuery.data?.decision;
  const commitments = decisionDetailQuery.data?.commitments ?? [];

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Executive Decisions Register"
        subtitle="Controlled record of executive mandates, corrective action directions, and resource allocations."
        actions={
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
          >
            <Plus size={14} /> Record Decision
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
            <option value="">All Decision Statuses</option>
            <option value="Proposed">Proposed</option>
            <option value="Recorded">Recorded</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-[var(--psm-muted)]">{rows.length} Decisions</span>
      </div>

      {/* Decisions Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="pb-3">Decision Code / Title</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Decision Maker &amp; Authority</th>
                <th className="pb-3">Criticality</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.length > 0 ? (
                rows.map((d: any) => (
                  <tr key={d.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="py-3 font-semibold text-[var(--psm-text)]">
                      <div>{d.decision_title}</div>
                      <div className="font-mono text-[10px] text-[var(--psm-muted)]">{d.decision_code}</div>
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">{d.decision_type}</td>
                    <td className="py-3 text-[var(--psm-muted)]">
                      <div className="font-medium text-[var(--psm-text)]">{d.decision_maker_user_id}</div>
                      <div className="text-[10px] text-[var(--psm-muted)]">{d.decision_authority_role}</div>
                    </td>
                    <td className="py-3">
                      <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                        {d.criticality || 'Safety Critical'}
                      </span>
                    </td>
                    <td className="py-3">
                      <ExecutiveDecisionStatusBadge status={d.decision_status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedDecisionId(d.id)}
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
                    No management decisions recorded for this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Decision Detail Modal */}
      {selectedDecisionId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
            <header className="flex items-center justify-between border-b border-[var(--psm-line)] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <ExecutiveDecisionStatusBadge status={detail.decision_status} />
                  <span className="font-mono text-xs text-[var(--psm-muted)]">{detail.decision_code}</span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-[var(--psm-text)]">{detail.decision_title}</h3>
              </div>
              <button
                onClick={() => setSelectedDecisionId(null)}
                className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--psm-surface-2)]"
              >
                Close
              </button>
            </header>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-5 py-2.5 text-xs">
              <span className="text-[var(--psm-muted)]">
                Recorded: {new Date(detail.created_at).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => mutations.submitDecision.mutate(detail.id)}
                  className="rounded bg-blue-600 px-3 py-1.5 font-bold text-white shadow-sm hover:opacity-90"
                >
                  Submit for Approval
                </button>
                <button
                  onClick={() => setCommitmentDialogOpen(true)}
                  className="flex items-center gap-1 rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
                >
                  <CheckSquare size={13} /> Link Commitment
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-4 space-y-2">
                <h5 className="font-bold text-[var(--psm-text)]">Decision Rationale &amp; Authority</h5>
                <p className="text-[var(--psm-muted)]">
                  {detail.decision_description}
                </p>
                {detail.decision_rationale && (
                  <p className="mt-2 text-[var(--psm-muted)] italic">
                    Rationale: {detail.decision_rationale}
                  </p>
                )}
              </div>

              {/* Linked Commitments */}
              <div>
                <h5 className="font-bold text-[var(--psm-text)] mb-2">
                  Follow-Up Commitments ({commitments.length})
                </h5>
                <div className="space-y-2">
                  {commitments.map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-3"
                    >
                      <div>
                        <div className="font-semibold text-[var(--psm-text)]">{c.commitment_title}</div>
                        <div className="text-[11px] text-[var(--psm-muted)]">Owner: {c.owner_user_id}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500">{c.commitment_status}</span>
                    </div>
                  ))}
                  {!commitments.length && (
                    <p className="py-4 text-center text-[var(--psm-muted)]">
                      No follow-up commitments currently linked to this decision.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {createDialogOpen && (
        <RecordExecutiveDecisionDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
        />
      )}
      {commitmentDialogOpen && selectedDecisionId && (
        <CreateManagementCommitmentDialog
          isOpen={commitmentDialogOpen}
          onClose={() => setCommitmentDialogOpen(false)}
        />
      )}
    </main>
  );
}
