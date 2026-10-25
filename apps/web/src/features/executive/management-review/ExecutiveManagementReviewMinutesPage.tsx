'use client';

import React, { useState } from 'react';
import { FileText, Lock, Send, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import {
  useManagementReviewRegister,
  useManagementReviewMinutes,
  useManagementReviewMutations,
} from '../hooks/useExecutiveManagementReview';
import {
  ExecutiveManagementReviewNav,
  ExecutiveManagementReviewHeader,
} from './ExecutiveManagementReviewShared';
import { ManagementReviewMinutesStatusBadge } from './ManagementReviewBadges';

export function ExecutiveManagementReviewMinutesPage() {
  const [selectedMinutesId, setSelectedMinutesId] = useState<string | null>(null);

  const query = useManagementReviewRegister('minutes');
  const mutations = useManagementReviewMutations();

  const minutesDetailQuery = useManagementReviewMinutes(selectedMinutesId || '');

  const rows = (query.data as any)?.rows ?? (Array.isArray(query.data) ? query.data : []);
  const detail = minutesDetailQuery.data?.minutes;
  const versions = minutesDetailQuery.data?.versions ?? [];

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Management Review Minutes & Records"
        subtitle="Formal governance minutes, approval workflows, immutable signed records, and version history."
      />

      {/* Minutes Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="pb-3">Minutes Code</th>
                <th className="pb-3">Meeting Reference</th>
                <th className="pb-3">Version</th>
                <th className="pb-3">Governance Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.length > 0 ? (
                rows.map((m: any) => (
                  <tr key={m.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="py-3 font-semibold text-[var(--psm-text)]">
                      <div className="font-mono">{m.minutes_code}</div>
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">{m.meeting_id}</td>
                    <td className="py-3 font-mono font-bold text-[var(--psm-text)]">
                      v{m.current_version_number ?? 1}
                    </td>
                    <td className="py-3">
                      <ManagementReviewMinutesStatusBadge status={m.minutes_status} />
                    </td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick={() => mutations.submitMinutes.mutate({ id: m.id, summary: m.summary || 'Minutes submitted for review.' })}
                        disabled={mutations.submitMinutes.isPending || m.minutes_status === 'Approved'}
                        className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--psm-surface-2)] disabled:opacity-50"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => mutations.requestMinutesApproval.mutate(m.id)}
                        disabled={mutations.requestMinutesApproval.isPending || m.minutes_status === 'Approved'}
                        className="rounded bg-[var(--psm-primary)] px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                      >
                        Request Approval
                      </button>
                      <button
                        onClick={() => setSelectedMinutesId(m.id)}
                        className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--psm-muted)]">
                    No management review minutes recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Minutes Detail & Versions Modal */}
      {selectedMinutesId && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
            <header className="flex items-center justify-between border-b border-[var(--psm-line)] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <ManagementReviewMinutesStatusBadge status={detail.minutes_status} />
                  <span className="font-mono text-xs text-[var(--psm-muted)]">{detail.minutes_code}</span>
                  {detail.minutes_status === 'Approved' && (
                    <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                      <Lock size={11} /> Locked &amp; Immutable
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-lg font-bold text-[var(--psm-text)]">
                  Leadership Review Minutes · Version {detail.current_version_number ?? 1}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMinutesId(null)}
                className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--psm-surface-2)]"
              >
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              <div className="rounded-lg bg-[var(--psm-surface-2)] p-4 space-y-2">
                <h5 className="font-bold text-[var(--psm-text)]">Executive Summary &amp; Chairman Remarks</h5>
                <p className="text-[var(--psm-muted)] leading-relaxed">
                  {detail.summary || 'Official meeting minutes record documenting PSM performance reviews, barrier restorations, and executive action allocations.'}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[var(--psm-text)] mb-2">Version History &amp; Audit Trail</h5>
                <div className="space-y-2">
                  <div className="rounded-lg border border-[var(--psm-line)] p-3">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Version {detail.current_version_number ?? 1} (Current Active)</span>
                      <span className="text-[10px] text-[var(--psm-muted)]">
                        {new Date(detail.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--psm-muted)]">
                      Locked upon chairperson approval. Material revisions generate an incremented immutable version.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
