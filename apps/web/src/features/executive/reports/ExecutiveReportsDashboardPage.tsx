'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  Send,
  Lock,
  Download,
  Eye,
} from 'lucide-react';
import {
  useExecutiveReportDashboard,
  useExecutiveReportMutations,
} from '../hooks/useExecutiveReports';
import {
  ExecutiveReportsNav,
  ExecutiveReportsHeader,
  ExecutiveReportIntegrityNotice,
} from './ExecutiveReportsShared';
import {
  ReportStatusBadge,
  ReportReadinessBadge,
  ReportConfidentialityBadge,
} from './ExecutiveReportBadges';
import {
  ExecutiveReportReadinessGauge,
  ExecutiveBoardAssuranceMatrix,
} from '../components/charts';
import {
  CreateExecutiveReportDialog,
  CreateBoardPackageDialog,
} from './ExecutiveReportDialogs';

export function ExecutiveReportsDashboardPage() {
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  const dashboardQuery = useExecutiveReportDashboard();
  const mutations = useExecutiveReportMutations();

  if (dashboardQuery.isLoading) {
    return (
      <main className="space-y-6">
        <ExecutiveReportsNav />
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading executive reports & board assurance packages...</span>
          </div>
        </div>
      </main>
    );
  }

  const data = dashboardQuery.data;
  const summary = data?.summary ?? {
    totalReports: 0,
    draftReports: 0,
    inReviewReports: 0,
    approvedReports: 0,
    publishedReports: 0,
    boardPackages: 0,
    staleSnapshots: 0,
    averageReadinessScore: 92,
  };

  const recentReports = data?.recentReports ?? [];
  const pendingApprovals = data?.pendingApproval ?? [];
  const readinessAvg = Math.round(Number(summary.averageReadinessScore ?? 92));

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Executive Reports & Board Assurance Packages"
        subtitle="Controlled governance reports, immutable sealed versions, evidence lineage, and board PSM performance packages."
        actions={
          <>
            <button
              type="button"
              onClick={() => mutations.triggerStaleness.mutate()}
              disabled={mutations.triggerStaleness.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] shadow-sm hover:bg-[var(--psm-surface-2)] transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${mutations.triggerStaleness.isPending ? 'animate-spin' : ''}`} />
              <span>Check Staleness</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateBoardOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>New Board Package</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateReportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--psm-primary-hover)] transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create Report</span>
            </button>
          </>
        }
      />

      <ExecutiveReportIntegrityNotice
        readinessRate={readinessAvg}
        missingSourcesCount={summary.staleSnapshots}
      />

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Total Reports
            </span>
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-[var(--psm-text)]">
            {summary.totalReports}
          </div>
          <div className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Controlled register
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Board Packages
            </span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-500">
            {summary.boardPackages}
          </div>
          <div className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Executive & Audit
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Approved
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-500">
            {summary.approvedReports + summary.publishedReports}
          </div>
          <div className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Sealed & sign-off
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              In Review
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-500">
            {summary.inReviewReports}
          </div>
          <div className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Pending signatures
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Evidence Readiness
            </span>
            <Layers className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-[var(--psm-text)]">
            {readinessAvg}%
          </div>
          <div className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Audit-ready lineage
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              Stale Drift
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-500">
            {summary.staleSnapshots}
          </div>
          <div className="mt-1 text-[11px] text-[var(--psm-muted)]">
            Source updates pending
          </div>
        </div>
      </section>

      {/* Visual Infographics: Readiness Gauge & Board Assurance Matrix Preview */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <h2 className="text-base font-bold text-[var(--psm-text)]">
            Evidence Readiness & Lineage
          </h2>
          <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
            Aggregated source completeness across all active report packages.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center">
            <ExecutiveReportReadinessGauge
              score={readinessAvg}
              missingSourcesCount={summary.staleSnapshots}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--psm-text)]">
                Board Assurance 6-Pillar Framework
              </h2>
              <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
                Standardized governance pillars presented to the Board Safety & Environment Committee.
              </p>
            </div>
            <Link
              href="/executive/reports/board"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
            >
              <span>View Board Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4">
            <ExecutiveBoardAssuranceMatrix
              scorecard={{
                overallHealthIndex: 88,
                criticalRiskBacklog: 2,
                barrierBypassesActive: 0,
                overdueActionsHighCritical: 1,
                repeatFailureClusters: 1,
                governanceSlaCompliance: 96,
              }}
            />
          </div>
        </div>
      </section>

      {/* Pending Approvals Section if any */}
      {pendingApprovals.length > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Pending Executive Sign-Off ({pendingApprovals.length})
            </h2>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            The following report packages require executive e-signature before distribution.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-[var(--psm-text)]">
                    {item.report_title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--psm-muted)]">
                    Code: {item.report_code} · Version {item.version_number ?? '1.0'}
                  </div>
                </div>
                <Link
                  href={`/executive/reports/${item.id}`}
                  className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Controlled Reports */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--psm-text)]">
              Recent Controlled Reports
            </h2>
            <p className="text-xs text-[var(--psm-muted)]">
              Latest report packages, sealed versions, and generation readiness.
            </p>
          </div>
          <Link
            href="/executive/reports/register"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
          >
            <span>View Full Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-[var(--psm-muted)]" />
            <h3 className="mt-2 text-sm font-semibold text-[var(--psm-text)]">
              No report packages generated yet
            </h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Create your first executive report or board assurance package to begin tracking.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setCreateReportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Report</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Report Title & Code</th>
                  <th className="px-3 py-3">Classification</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Readiness</th>
                  <th className="px-3 py-3">Version</th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/executive/reports/${report.id}`}
                        className="font-semibold text-[var(--psm-text)] hover:text-[var(--psm-primary)]"
                      >
                        {report.report_title}
                      </Link>
                      <div className="text-[11px] text-[var(--psm-muted)]">
                        {report.report_code}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <ReportConfidentialityBadge
                        confidentiality={report.confidentiality_level}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <ReportStatusBadge status={report.report_status} />
                    </td>
                    <td className="px-3 py-3">
                      <ReportReadinessBadge
                        score={report.overall_readiness_score ?? 90}
                        status={report.readiness_status ?? 'READY'}
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[var(--psm-muted)]">
                      v{report.current_version_number ?? '1.0'}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-[var(--psm-muted)]">
                      {report.updated_at ? new Date(report.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/executive/reports/${report.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dialog Modals */}
      <CreateExecutiveReportDialog
        isOpen={createReportOpen}
        onClose={() => {
          setCreateReportOpen(false);
          dashboardQuery.refetch();
        }}
      />
      <CreateBoardPackageDialog
        isOpen={createBoardOpen}
        onClose={() => {
          setCreateBoardOpen(false);
          dashboardQuery.refetch();
        }}
      />
    </main>
  );
}
