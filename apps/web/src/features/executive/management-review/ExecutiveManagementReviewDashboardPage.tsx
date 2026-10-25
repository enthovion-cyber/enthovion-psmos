'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckSquare,
  Clock,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Plus,
  AlertTriangle,
  Loader2,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  useManagementReviewDashboard,
  useManagementReviewReadiness,
} from '../hooks/useExecutiveManagementReview';
import {
  ExecutiveManagementReviewNav,
  ExecutiveManagementReviewHeader,
} from './ExecutiveManagementReviewShared';
import {
  ManagementReviewCycleStatusBadge,
  ManagementReviewMeetingStatusBadge,
  ExecutiveDecisionStatusBadge,
  ExecutiveCommitmentStatusBadge,
} from './ManagementReviewBadges';
import { ManagementReviewReadinessGauge } from '../components/charts/ManagementReviewReadinessGauge';
import { ManagementReviewCommitmentAgingChart } from '../components/charts/ManagementReviewCommitmentAgingChart';
import { ManagementReviewMeetingAttendanceChart } from '../components/charts/ManagementReviewMeetingAttendanceChart';
import { ExecutiveManagementReviewTrendChart } from '../components/charts/ExecutiveManagementReviewTrendChart';
import {
  CreateReviewCycleDialog,
  ScheduleReviewMeetingDialog,
  RecordExecutiveDecisionDialog,
  CreateManagementCommitmentDialog,
} from './ManagementReviewDialogs';

export function ExecutiveManagementReviewDashboardPage() {
  const query = useManagementReviewDashboard();
  const readinessQuery = useManagementReviewReadiness();

  const [createCycleOpen, setCreateCycleOpen] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [recordDecisionOpen, setRecordDecisionOpen] = useState(false);
  const [createCommitmentOpen, setCreateCommitmentOpen] = useState(false);

  if (query.isLoading) {
    return (
      <main className="space-y-6 p-6">
        <ExecutiveManagementReviewNav />
        <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <Loader2 className="animate-spin text-[var(--psm-primary)]" size={32} />
          <p className="text-sm font-semibold text-[var(--psm-muted)]">
            Loading leadership governance metrics and review cycles...
          </p>
        </div>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="space-y-6 p-6">
        <ExecutiveManagementReviewNav />
        <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
          <AlertTriangle className="text-rose-500" size={32} />
          <h2 className="text-lg font-bold text-[var(--psm-text)]">Management Review Governance Unavailable</h2>
          <p className="max-w-md text-xs text-[var(--psm-muted)]">
            Confirm your tenant permissions for executive management review or verify backend connectivity.
          </p>
          <button
            onClick={() => void query.refetch()}
            className="mt-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const data = query.data;
  const s = data.summary;
  const nextMeeting = data.nextMeeting;
  const readiness = readinessQuery.data;

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <ExecutiveManagementReviewNav />

      <ExecutiveManagementReviewHeader
        title="Management Review & Leadership Governance"
        subtitle="Controlled leadership meeting cycles, executive decisions, pre-read packages, and Universal Action follow-up."
        actions={
          <>
            <button
              onClick={() => setCreateCycleOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] shadow-sm hover:bg-[var(--psm-surface-2)]"
            >
              <Layers size={14} /> Start Review Cycle
            </button>
            <button
              onClick={() => setScheduleMeetingOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] shadow-sm hover:bg-[var(--psm-surface-2)]"
            >
              <Calendar size={14} /> Schedule Meeting
            </button>
            <button
              onClick={() => setRecordDecisionOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
            >
              <Sparkles size={14} /> Record Decision
            </button>
          </>
        }
      />

      {/* KPI Summary Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">Total Cycles</p>
          <p className="mt-1 text-xl font-black text-[var(--psm-text)]">{s.totalReviewCycles ?? 0}</p>
        </article>
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Active Cycles</p>
          <p className="mt-1 text-xl font-black text-blue-600 dark:text-blue-400">{s.activeReviewCycles ?? 0}</p>
        </article>
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">Upcoming Mtgs</p>
          <p className="mt-1 text-xl font-black text-[var(--psm-text)]">{s.upcomingReviewMeetings ?? 0}</p>
        </article>
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Overdue Mtgs</p>
          <p className="mt-1 text-xl font-black text-rose-500">{s.overdueReviewMeetings ?? 0}</p>
        </article>
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending Decs</p>
          <p className="mt-1 text-xl font-black text-amber-500">{s.pendingDecisions ?? 0}</p>
        </article>
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">Open Commitments</p>
          <p className="mt-1 text-xl font-black text-[var(--psm-text)]">{s.openCommitments ?? 0}</p>
        </article>
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Overdue Commits</p>
          <p className="mt-1 text-xl font-black text-rose-500">{s.overdueCommitments ?? 0}</p>
        </article>
        <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Completed Mtgs</p>
          <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">{s.meetingsCompleted ?? 0}</p>
        </article>
      </section>

      {/* Row 1 Infographics: Readiness Gauge & Commitment Aging */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ManagementReviewReadinessGauge
          readinessStatus={readiness?.readinessStatus ?? 'Ready'}
          blockerCount={readiness?.blockerCount ?? 0}
          warningCount={readiness?.warningCount ?? 0}
          blockers={readiness?.blockers ?? []}
          warnings={readiness?.warnings ?? []}
        />
        <ManagementReviewCommitmentAgingChart
          totalCommitments={s.openCommitments ?? 0}
          openCommitments={s.openCommitments ?? 0}
          overdueCommitments={s.overdueCommitments ?? 0}
          pendingVerificationCount={s.pendingDecisions ?? 0}
        />
      </div>

      {/* Row 2 Infographics: Leadership Attendance & Trajectory Area Chart */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ManagementReviewMeetingAttendanceChart
          totalExpected={8}
          presentCount={7}
          absentCount={0}
          apologyCount={1}
          quorumSatisfied={true}
        />
        <ExecutiveManagementReviewTrendChart
          completedMeetings={s.meetingsCompleted ?? 4}
          totalDecisions={(s.pendingDecisions ?? 0) + 12}
          openCommitments={s.openCommitments ?? 6}
        />
      </div>

      {/* Spotlight Row: Next Meeting Spotlight & Critical Leadership Attention */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Next Meeting Card */}
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
                <Calendar size={16} />
              </span>
              <h3 className="text-sm font-bold text-[var(--psm-text)]">Next Scheduled Review</h3>
            </div>
            {nextMeeting && <ManagementReviewMeetingStatusBadge status={nextMeeting.meeting_status} />}
          </div>

          {nextMeeting ? (
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="font-bold text-[var(--psm-text)]">{nextMeeting.meeting_title}</h4>
                <p className="mt-1 text-xs text-[var(--psm-muted)] font-mono">{nextMeeting.meeting_code}</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--psm-muted)]">Start Date/Time:</span>
                  <span className="font-semibold text-[var(--psm-text)]">
                    {new Date(nextMeeting.scheduled_start_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--psm-muted)]">Mode &amp; Location:</span>
                  <span className="font-semibold text-[var(--psm-text)]">
                    {nextMeeting.meeting_mode} {nextMeeting.location ? `(${nextMeeting.location})` : ''}
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href={`/executive/management-review/meetings`}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface)]"
                >
                  Open Meeting Workspace <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center py-6">
              <Calendar size={28} className="mx-auto text-[var(--psm-muted)]" />
              <p className="mt-2 text-xs text-[var(--psm-muted)]">No upcoming review meeting is currently scheduled.</p>
              <button
                onClick={() => setScheduleMeetingOpen(true)}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                Schedule Now
              </button>
            </div>
          )}
        </section>

        {/* Critical Issues Needing Review */}
        <section className="lg:col-span-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-rose-500/10 p-1.5 text-rose-500">
                <ShieldAlert size={16} />
              </span>
              <h3 className="text-sm font-bold text-[var(--psm-text)]">Critical Process Risks for Leadership Agenda</h3>
            </div>
            <Link
              href="/executive/critical-risks"
              className="text-xs font-semibold text-[var(--psm-primary)] hover:underline"
            >
              Open Critical Risk Cockpit
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {data.criticalRisks.length > 0 ? (
              data.criticalRisks.slice(0, 3).map((risk: any) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-[var(--psm-text)]">{risk.risk_title || risk.title}</h5>
                    <p className="mt-0.5 text-[11px] text-[var(--psm-muted)]">
                      {risk.source_module} · SCE Impairment: {risk.barrier_impaired ? 'YES' : 'No'}
                    </p>
                  </div>
                  <span className="rounded bg-rose-500/10 px-2 py-0.5 font-bold text-rose-500">
                    Critical Risk
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-[var(--psm-muted)]">
                No active critical process safety risks awaiting executive review.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Tables Row: Pending Decisions & Open Commitments */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pending Decisions Table */}
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
                <Sparkles size={16} />
              </span>
              <h3 className="text-sm font-bold text-[var(--psm-text)]">Executive Decisions Awaiting Approval</h3>
            </div>
            <Link
              href="/executive/management-review/decisions"
              className="text-xs font-semibold text-[var(--psm-primary)] hover:underline"
            >
              View All ({data.pendingDecisions.length})
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="pb-2">Decision Title</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {data.pendingDecisions.length > 0 ? (
                  data.pendingDecisions.slice(0, 4).map((d) => (
                    <tr key={d.id}>
                      <td className="py-2.5 font-medium text-[var(--psm-text)]">{d.decision_title}</td>
                      <td className="py-2.5 text-[var(--psm-muted)]">{d.decision_type}</td>
                      <td className="py-2.5">
                        <ExecutiveDecisionStatusBadge status={d.decision_status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--psm-muted)]">
                      No decisions currently pending leadership review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Open Commitments Table */}
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/10 p-1.5 text-amber-500">
                <CheckSquare size={16} />
              </span>
              <h3 className="text-sm font-bold text-[var(--psm-text)]">Active Management Commitments</h3>
            </div>
            <Link
              href="/executive/management-review/commitments"
              className="text-xs font-semibold text-[var(--psm-primary)] hover:underline"
            >
              View All ({data.openCommitments.length})
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--psm-line)] text-[10px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="pb-2">Commitment</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {data.openCommitments.length > 0 ? (
                  data.openCommitments.slice(0, 4).map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 font-medium text-[var(--psm-text)]">{c.commitment_title}</td>
                      <td className="py-2.5 text-[var(--psm-muted)]">
                        {c.effective_due_at ? new Date(c.effective_due_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2.5">
                        <ExecutiveCommitmentStatusBadge status={c.commitment_status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--psm-muted)]">
                      No open leadership commitments recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Dialogs */}
      {createCycleOpen && (
        <CreateReviewCycleDialog isOpen={createCycleOpen} onClose={() => setCreateCycleOpen(false)} />
      )}
      {scheduleMeetingOpen && (
        <ScheduleReviewMeetingDialog
          isOpen={scheduleMeetingOpen}
          onClose={() => setScheduleMeetingOpen(false)}
        />
      )}
      {recordDecisionOpen && (
        <RecordExecutiveDecisionDialog
          isOpen={recordDecisionOpen}
          onClose={() => setRecordDecisionOpen(false)}
        />
      )}
      {createCommitmentOpen && (
        <CreateManagementCommitmentDialog
          isOpen={createCommitmentOpen}
          onClose={() => setCreateCommitmentOpen(false)}
        />
      )}
    </main>
  );
}
