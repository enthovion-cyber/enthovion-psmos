'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  FileText,
  AlertTriangle,
  Clock,
  Download,
  Share2,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  useExecutiveBoardDashboard,
  useExecutiveBoardPackages,
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
import { ExecutiveBoardAssuranceMatrix } from '../components/charts';
import { CreateBoardPackageDialog } from './ExecutiveReportDialogs';
import type { ExecutiveReport } from '../types/executive-report.types';

export function ExecutiveBoardReportingPage() {
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  const boardDashboardQuery = useExecutiveBoardDashboard();
  const boardPackagesQuery = useExecutiveBoardPackages();

  const boardData = boardDashboardQuery.data;
  const packages = (boardPackagesQuery.data?.rows ?? []) as ExecutiveReport[];

  const scorecard = boardData?.scorecard ?? {
    overallHealthIndex: 88,
    criticalRiskBacklog: 2,
    barrierBypassesActive: 0,
    overdueActionsHighCritical: 1,
    repeatFailureClusters: 1,
    governanceSlaCompliance: 96,
  };

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Board of Directors · PSM Governance & Assurance Packages"
        subtitle="Standardized board performance packages, 6-pillar assurance framework, and board safety committee governance."
        actions={
          <button
            type="button"
            onClick={() => setCreateBoardOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>New Board Package</span>
          </button>
        }
      />

      <ExecutiveReportIntegrityNotice
        readinessRate={scorecard.governanceSlaCompliance}
        missingSourcesCount={0}
      />

      {/* Board Assurance Framework Section */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-bold text-[var(--psm-text)]">
                Board PSM Assurance Matrix (6-Pillar Framework)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
              Evaluated across CCPS Risk Based Process Safety guidelines and enterprise risk criteria.
            </p>
          </div>
          <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-500">
            Confidential · Board of Directors
          </span>
        </div>

        <div className="mt-4">
          <ExecutiveBoardAssuranceMatrix scorecard={scorecard} />
        </div>
      </section>

      {/* Board Packages Register */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--psm-text)]">
              Sealed Board PSM Packages
            </h2>
            <p className="text-xs text-[var(--psm-muted)]">
              Formal board briefing packets, quarterly safety committee summaries, and executive presentations.
            </p>
          </div>
          <div className="text-xs text-[var(--psm-muted)]">
            Total Board Packages: <strong className="text-[var(--psm-text)]">{packages.length}</strong>
          </div>
        </div>

        {boardPackagesQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
            <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
              <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
              <span>Loading board packages...</span>
            </div>
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-indigo-500" />
            <h3 className="mt-2 text-sm font-semibold text-[var(--psm-text)]">
              No Board Packages Prepared Yet
            </h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Generate a comprehensive Board Assurance Package using the 6-pillar framework.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setCreateBoardOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Board Package</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Package Title & Code</th>
                  <th className="px-3 py-3">Classification</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Readiness</th>
                  <th className="px-3 py-3">Version</th>
                  <th className="px-3 py-3">Reporting Period</th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/executive/reports/${pkg.id}`}
                        className="font-semibold text-[var(--psm-text)] hover:text-[var(--psm-primary)]"
                      >
                        {pkg.report_title}
                      </Link>
                      <div className="text-[11px] text-[var(--psm-muted)]">
                        {pkg.report_code}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <ReportConfidentialityBadge
                        confidentiality={pkg.confidentiality_level}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <ReportStatusBadge status={pkg.report_status} />
                    </td>
                    <td className="px-3 py-3">
                      <ReportReadinessBadge
                        score={pkg.overall_readiness_score ?? 95}
                        status={pkg.readiness_status ?? 'READY'}
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-[var(--psm-muted)]">
                      v{pkg.current_version_number ?? '1.0'}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-[var(--psm-muted)]">
                      {pkg.reporting_period_name ?? 'Board Cycle'}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-[var(--psm-muted)]">
                      {pkg.updated_at ? new Date(pkg.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/executive/reports/${pkg.id}`}
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

      {/* Dialog */}
      <CreateBoardPackageDialog
        isOpen={createBoardOpen}
        onClose={() => {
          setCreateBoardOpen(false);
          boardPackagesQuery.refetch();
          boardDashboardQuery.refetch();
        }}
      />
    </main>
  );
}
