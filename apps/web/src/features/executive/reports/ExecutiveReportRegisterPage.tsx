'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  Share2,
  RefreshCw,
} from 'lucide-react';
import {
  useExecutiveReports,
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
  CreateExecutiveReportDialog,
  CreateBoardPackageDialog,
} from './ExecutiveReportDialogs';
import type { ExecutiveReport } from '../types/executive-report.types';

export function ExecutiveReportRegisterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confidentialityFilter, setConfidentialityFilter] = useState('ALL');
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  const reportsQuery = useExecutiveReports();
  const mutations = useExecutiveReportMutations();

  const reports = (reportsQuery.data?.rows ?? []) as ExecutiveReport[];

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        !searchTerm.trim() ||
        r.report_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.report_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.report_type_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        r.report_status?.toUpperCase() === statusFilter.toUpperCase();

      const matchConfidentiality =
        confidentialityFilter === 'ALL' ||
        r.confidentiality_level?.toUpperCase() === confidentialityFilter.toUpperCase();

      return matchSearch && matchStatus && matchConfidentiality;
    });
  }, [reports, searchTerm, statusFilter, confidentialityFilter]);

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Controlled Report Register"
        subtitle="Immutable audit-ready performance reports, executive packages, and signed PSM governance documents."
        actions={
          <>
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
        readinessRate={92}
        missingSourcesCount={0}
      />

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--psm-muted)]" />
          <input
            type="text"
            placeholder="Search by report title, code, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] pl-9 pr-3 py-2 text-xs text-[var(--psm-text)] placeholder-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-2 text-xs text-[var(--psm-text)] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={confidentialityFilter}
            onChange={(e) => setConfidentialityFilter(e.target.value)}
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-2 text-xs text-[var(--psm-text)] focus:outline-none"
          >
            <option value="ALL">All Classifications</option>
            <option value="BOARD_CONFIDENTIAL">Board Confidential</option>
            <option value="RESTRICTED">Restricted</option>
            <option value="INTERNAL">Internal</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {reportsQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading controlled reports register...</span>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-[var(--psm-muted)]" />
          <h3 className="mt-3 text-sm font-semibold text-[var(--psm-text)]">
            No matching reports found
          </h3>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Try adjusting your search criteria or create a new controlled report package.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setConfidentialityFilter('ALL');
              }}
              className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)]"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setCreateReportOpen(true)}
              className="rounded-lg bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Create Report
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">Report Title & Code</th>
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
              {filteredReports.map((report) => (
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
                    {report.reporting_period_name ?? 'Ad-hoc Period'}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-[var(--psm-muted)]">
                    {report.updated_at ? new Date(report.updated_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/executive/reports/${report.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog Modals */}
      <CreateExecutiveReportDialog
        isOpen={createReportOpen}
        onClose={() => {
          setCreateReportOpen(false);
          reportsQuery.refetch();
        }}
      />
      <CreateBoardPackageDialog
        isOpen={createBoardOpen}
        onClose={() => {
          setCreateBoardOpen(false);
          reportsQuery.refetch();
        }}
      />
    </main>
  );
}
