'use client';

import React, { useState } from 'react';
import { Layers, Plus, Filter, ArrowRight, CheckCircle2, Archive, Play, RefreshCw, Loader2 } from 'lucide-react';
import { useManagementReviewRegister, useManagementReviewCycle, useManagementReviewMutations } from '../hooks/useExecutiveManagementReview';
import { ExecutiveManagementReviewNav, ExecutiveManagementReviewHeader } from './ExecutiveManagementReviewShared';
import { ManagementReviewCycleStatusBadge, ManagementReviewReadinessBadge } from './ManagementReviewBadges';
import { CreateReviewCycleDialog } from './ManagementReviewDialogs';
import type { ManagementReviewCycle } from '../types/executive-management-review.types';

export function ExecutiveManagementReviewCyclesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const query = useManagementReviewRegister('cycles', statusFilter ? { status: statusFilter } : undefined);
  const mutations = useManagementReviewMutations();

  const cycleDetailQuery = useManagementReviewCycle(selectedCycleId || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'decisions' | 'commitments'>('overview');

  const rows = (query.data as any)?.rows ?? (Array.isArray(query.data) ? query.data : []);

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Management Review Cycles"
        subtitle="Controlled governance reporting periods tracking executive reviews, decision closures, and leadership commitments."
        actions={
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
          >
            <Plus size={14} /> New Review Cycle
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
        <div className="flex items-center gap-2 text-xs">
          <Filter size={14} className="text-[var(--psm-muted)]" />
          <span className="font-semibold text-[var(--psm-text)]">Filter Status:</span>
          <select
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs text-[var(--psm-text)]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Cycle Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Planned">Planned</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <span className="text-xs font-semibold text-[var(--psm-muted)]">{rows.length} Cycles</span>
      </div>

      {/* Cycles Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="pb-3">Cycle Title / Code</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Reporting Period</th>
                <th className="pb-3">Governance Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.length > 0 ? (
                rows.map((cycle: any) => (
                  <tr key={cycle.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="py-3 font-semibold text-[var(--psm-text)]">
                      <div>{cycle.cycle_title}</div>
                      <div className="font-mono text-[10px] text-[var(--psm-muted)]">{cycle.cycle_code}</div>
                    </td>
                    <td className="py-3 text-[var(--psm-muted)]">{cycle.cycle_type}</td>
                    <td className="py-3 text-[var(--psm-muted)]">
                      {new Date(cycle.reporting_period_start).toLocaleDateString()} –{' '}
                      {new Date(cycle.reporting_period_end).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <ManagementReviewCycleStatusBadge status={cycle.cycle_status} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedCycleId(cycle.id)}
                        className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-primary)] hover:bg-[var(--psm-surface-2)]"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--psm-muted)]">
                    No management review cycles found for this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cycle Detail Drawer / Modal */}
      {selectedCycleId && cycleDetailQuery.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
            <header className="flex items-center justify-between border-b border-[var(--psm-line)] p-5">
              <div>
                <div className="flex items-center gap-2">
                  <ManagementReviewCycleStatusBadge status={cycleDetailQuery.data.cycle.cycle_status} />
                  <span className="font-mono text-xs text-[var(--psm-muted)]">
                    {cycleDetailQuery.data.cycle.cycle_code}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-bold text-[var(--psm-text)]">
                  {cycleDetailQuery.data.cycle.cycle_title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCycleId(null)}
                className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--psm-surface-2)]"
              >
                Close
              </button>
            </header>

            {/* Lifecycle Transition Buttons */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-5 py-2.5 text-xs">
              <span className="font-semibold text-[var(--psm-muted)]">Cycle Lifecycle Actions:</span>
              {cycleDetailQuery.data.cycle.cycle_status === 'Draft' && (
                <button
                  onClick={() => mutations.activateCycle.mutate(selectedCycleId)}
                  className="flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 font-semibold text-white shadow-sm hover:opacity-90"
                >
                  <Play size={12} /> Activate Cycle
                </button>
              )}
              {cycleDetailQuery.data.cycle.cycle_status !== 'Completed' && (
                <button
                  onClick={() => mutations.completeCycle.mutate({ id: selectedCycleId })}
                  className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 font-semibold text-white shadow-sm hover:opacity-90"
                >
                  <CheckCircle2 size={12} /> Complete Cycle
                </button>
              )}
              <button
                onClick={() => mutations.archiveCycle.mutate({ id: selectedCycleId })}
                className="flex items-center gap-1 rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
              >
                <Archive size={12} /> Archive
              </button>
            </div>

            {/* Detail Tabs */}
            <div className="flex border-b border-[var(--psm-line)] px-5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 border-b-2 mr-4 transition ${
                  activeTab === 'overview'
                    ? 'border-[var(--psm-primary)] text-[var(--psm-primary)]'
                    : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('meetings')}
                className={`py-3 border-b-2 mr-4 transition ${
                  activeTab === 'meetings'
                    ? 'border-[var(--psm-primary)] text-[var(--psm-primary)]'
                    : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
                }`}
              >
                Meetings ({cycleDetailQuery.data.meetings.length})
              </button>
              <button
                onClick={() => setActiveTab('decisions')}
                className={`py-3 border-b-2 mr-4 transition ${
                  activeTab === 'decisions'
                    ? 'border-[var(--psm-primary)] text-[var(--psm-primary)]'
                    : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
                }`}
              >
                Decisions ({cycleDetailQuery.data.decisions.length})
              </button>
              <button
                onClick={() => setActiveTab('commitments')}
                className={`py-3 border-b-2 transition ${
                  activeTab === 'commitments'
                    ? 'border-[var(--psm-primary)] text-[var(--psm-primary)]'
                    : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
                }`}
              >
                Commitments ({cycleDetailQuery.data.commitments.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
                      <span className="text-[var(--psm-muted)]">Type:</span>
                      <p className="font-semibold text-[var(--psm-text)] mt-0.5">
                        {cycleDetailQuery.data.cycle.cycle_type}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--psm-surface-2)] p-3">
                      <span className="text-[var(--psm-muted)]">Governance Level:</span>
                      <p className="font-semibold text-[var(--psm-text)] mt-0.5">
                        {cycleDetailQuery.data.cycle.governance_level}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-[var(--psm-text)]">Governance Policy &amp; Scope</h5>
                    <p className="mt-1 text-[var(--psm-muted)]">
                      {cycleDetailQuery.data.cycle.notes || 'Standard executive PSM governance cycle.'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'meetings' && (
                <div className="space-y-2">
                  {cycleDetailQuery.data.meetings.map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-3"
                    >
                      <div>
                        <h5 className="font-bold text-[var(--psm-text)]">{m.meeting_title}</h5>
                        <p className="text-[11px] text-[var(--psm-muted)]">
                          {new Date(m.scheduled_start_at).toLocaleString()} · {m.meeting_mode}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">{m.meeting_status}</span>
                    </div>
                  ))}
                  {!cycleDetailQuery.data.meetings.length && (
                    <p className="py-6 text-center text-[var(--psm-muted)]">No meetings scheduled for this cycle.</p>
                  )}
                </div>
              )}

              {activeTab === 'decisions' && (
                <div className="space-y-2">
                  {cycleDetailQuery.data.decisions.map((d: any) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-[var(--psm-line)] p-3"
                    >
                      <h5 className="font-bold text-[var(--psm-text)]">{d.decision_title}</h5>
                      <p className="mt-1 text-[11px] text-[var(--psm-muted)]">{d.decision_description}</p>
                    </div>
                  ))}
                  {!cycleDetailQuery.data.decisions.length && (
                    <p className="py-6 text-center text-[var(--psm-muted)]">No decisions recorded yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'commitments' && (
                <div className="space-y-2">
                  {cycleDetailQuery.data.commitments.map((c: any) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-[var(--psm-line)] p-3"
                    >
                      <h5 className="font-bold text-[var(--psm-text)]">{c.commitment_title}</h5>
                      <p className="mt-1 text-[11px] text-[var(--psm-muted)]">{c.commitment_description}</p>
                    </div>
                  ))}
                  {!cycleDetailQuery.data.commitments.length && (
                    <p className="py-6 text-center text-[var(--psm-muted)]">No commitments recorded yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {createDialogOpen && (
        <CreateReviewCycleDialog isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
      )}
    </main>
  );
}
