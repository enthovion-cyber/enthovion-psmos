'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  Lock,
  Layers,
  AlertTriangle,
  History,
  Send,
  Eye,
  FileCheck,
  RefreshCw,
  Plus,
  Hash,
} from 'lucide-react';
import {
  useExecutiveReportDetail,
  useExecutiveReportContents,
  useExecutiveReportSources,
  useExecutiveReportReadiness,
  useExecutiveReportArtifacts,
  useExecutiveReportDistribution,
  useExecutiveReportHistory,
  useExecutiveReportMutations,
} from '../hooks/useExecutiveReports';
import {
  ExecutiveReportsNav,
  ExecutiveReportIntegrityNotice,
} from './ExecutiveReportsShared';
import {
  ReportStatusBadge,
  ReportReadinessBadge,
  ReportConfidentialityBadge,
  ReportApprovalBadge,
  ReportFormatBadge,
} from './ExecutiveReportBadges';
import { ExecutiveReportReadinessGauge } from '../components/charts';
import {
  GenerateReportArtifactDialog,
  SubmitReportApprovalDialog,
  ApproveReportDialog,
  DistributeReportDialog,
} from './ExecutiveReportDialogs';
import type {
  ExecutiveReport,
  ExecutiveReportVersion,
  ExecutiveReportSectionSnapshot,
  ExecutiveReportManifestItem,
  ExecutiveReportArtifact,
  ExecutiveReportDistributionRecord,
} from '../types/executive-report.types';

type DetailTab =
  | 'overview'
  | 'contents'
  | 'sources'
  | 'readiness'
  | 'artifacts'
  | 'approvals'
  | 'distribution'
  | 'history';

export function ExecutiveReportDetailPage({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [submitApprovalOpen, setSubmitApprovalOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [distributeOpen, setDistributeOpen] = useState(false);

  const detailQuery = useExecutiveReportDetail(id);
  const contentsQuery = useExecutiveReportContents(id);
  const sourcesQuery = useExecutiveReportSources(id);
  const readinessQuery = useExecutiveReportReadiness(id);
  const artifactsQuery = useExecutiveReportArtifacts(id);
  const distributionQuery = useExecutiveReportDistribution(id);
  const historyQuery = useExecutiveReportHistory(id);

  const mutations = useExecutiveReportMutations();

  if (detailQuery.isLoading) {
    return (
      <main className="space-y-6">
        <ExecutiveReportsNav />
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading controlled report package...</span>
          </div>
        </div>
      </main>
    );
  }

  if (detailQuery.isError || !detailQuery.data?.report) {
    return (
      <main className="space-y-6">
        <ExecutiveReportsNav />
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
          <h2 className="mt-2 text-base font-bold text-[var(--psm-text)]">
            Report package not found or access restricted
          </h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            The requested controlled report package does not exist or you do not have permission to view it.
          </p>
          <div className="mt-4">
            <Link
              href="/executive/reports/register"
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Register</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const report = detailQuery.data.report as ExecutiveReport;
  const versions = (detailQuery.data.versions ?? []) as ExecutiveReportVersion[];
  const activeVersion = versions[0];

  const sections = (contentsQuery.data?.sections ?? []) as ExecutiveReportSectionSnapshot[];
  const sources = (sourcesQuery.data?.sources ?? []) as ExecutiveReportManifestItem[];
  const readiness = readinessQuery.data?.readiness;
  const artifacts = (artifactsQuery.data?.artifacts ?? []) as ExecutiveReportArtifact[];
  const distributions = (distributionQuery.data?.rows ?? []) as ExecutiveReportDistributionRecord[];
  const historyEvents = (historyQuery.data?.rows ?? []) as Array<Record<string, unknown>>;

  const isDraft = report.report_status === 'DRAFT';
  const isInReview = report.report_status === 'IN_REVIEW';
  const isApproved = report.report_status === 'APPROVED' || report.report_status === 'PUBLISHED';

  const handleValidate = async () => {
    await mutations.validateReport.mutateAsync(id);
    detailQuery.refetch();
    sourcesQuery.refetch();
    readinessQuery.refetch();
  };

  const handleCreateNewVersion = async () => {
    await mutations.createVersion.mutateAsync({
      reportId: id,
      changeSummary: 'New revision initiated by governance lead',
    });
    detailQuery.refetch();
  };

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/executive/reports/register"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Report Register</span>
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-[var(--psm-line)] pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--psm-primary)]">
                {report.report_code}
              </span>
              <ReportConfidentialityBadge confidentiality={report.confidentiality_level} />
              <ReportStatusBadge status={report.report_status} />
              <ReportReadinessBadge
                score={report.overall_readiness_score ?? 90}
                status={report.readiness_status ?? 'READY'}
              />
              <span className="font-mono text-xs rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-[var(--psm-muted)]">
                v{report.current_version_number ?? '1.0'}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black text-[var(--psm-text)]">
              {report.report_title}
            </h1>

            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Period: <strong className="text-[var(--psm-text)]">{report.reporting_period_name ?? 'Ad-hoc'}</strong> ·
              Scope: <strong className="text-[var(--psm-text)]">{report.site_name ?? 'Company-Wide'}</strong> ·
              Last modified: <strong className="text-[var(--psm-text)]">{report.updated_at ? new Date(report.updated_at).toLocaleString() : '—'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Action buttons depending on state */}
            <button
              type="button"
              onClick={handleValidate}
              disabled={mutations.validateReport.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${mutations.validateReport.isPending ? 'animate-spin' : ''}`} />
              <span>Validate Sources</span>
            </button>

            <button
              type="button"
              onClick={() => setGenerateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Generate Export</span>
            </button>

            {isDraft && (
              <button
                type="button"
                onClick={() => setSubmitApprovalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--psm-primary-hover)] transition"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Submit for Approval</span>
              </button>
            )}

            {isInReview && (
              <button
                type="button"
                onClick={() => setApproveOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Sign & Approve</span>
              </button>
            )}

            {isApproved && (
              <>
                <button
                  type="button"
                  onClick={() => setDistributeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Distribute</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateNewVersion}
                  disabled={mutations.createVersion.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Version</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ExecutiveReportIntegrityNotice
        readinessRate={report.overall_readiness_score ?? 90}
        missingSourcesCount={readiness?.missingCount ?? 0}
      />

      {/* Detail Navigation Tabs */}
      <div className="flex border-b border-[var(--psm-line)] text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview & Summary', icon: FileText },
          { key: 'contents', label: `Sections (${sections.length})`, icon: Layers },
          { key: 'sources', label: `Sources & Lineage (${sources.length})`, icon: Hash },
          { key: 'readiness', label: 'Readiness & Gaps', icon: ShieldCheck },
          { key: 'artifacts', label: `Artifacts (${artifacts.length})`, icon: Download },
          { key: 'distribution', label: `Distribution (${distributions.length})`, icon: Send },
          { key: 'history', label: `Audit Log (${historyEvents.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as DetailTab)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 transition ${
                isActive
                  ? 'border-[var(--psm-primary)] text-[var(--psm-primary)]'
                  : 'border-transparent text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {/* 1. Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[var(--psm-text)]">
                Executive Commentary & Purpose
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--psm-muted)]">
                {report.executive_summary ||
                  'No initial executive commentary was provided for this package. Commentary can be added during revision or review cycles.'}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[var(--psm-text)]">
                Package Structure & Sections Overview
              </h2>
              <div className="mt-3 space-y-2">
                {sections.length === 0 ? (
                  <p className="text-xs text-[var(--psm-muted)]">
                    No section snapshots generated yet. Validate sources to initialize sections.
                  </p>
                ) : (
                  sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--psm-muted)]">
                          0{idx + 1}
                        </span>
                        <span className="font-semibold text-[var(--psm-text)]">
                          {sec.section_title}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--psm-muted)]">
                        {sec.section_key}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[var(--psm-text)]">
                Evidence Readiness
              </h2>
              <div className="mt-4 flex flex-col items-center">
                <ExecutiveReportReadinessGauge
                  score={report.overall_readiness_score ?? 90}
                  missingSourcesCount={readiness?.missingCount ?? 0}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm text-xs space-y-3">
              <h2 className="text-sm font-bold text-[var(--psm-text)]">
                Controlled Seal Details
              </h2>
              <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
                <span className="text-[var(--psm-muted)]">Version ID:</span>
                <span className="font-mono font-bold text-[var(--psm-text)]">
                  {activeVersion?.version_number ?? '1.0'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
                <span className="text-[var(--psm-muted)]">Cut-Off Date:</span>
                <span className="font-semibold text-[var(--psm-text)]">
                  {report.cut_off_date ? new Date(report.cut_off_date).toLocaleDateString() : 'Real-time'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
                <span className="text-[var(--psm-muted)]">Approved By:</span>
                <span className="font-semibold text-[var(--psm-text)]">
                  {report.approved_by_name ?? 'Pending Sign-off'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--psm-muted)]">Distribution Count:</span>
                <span className="font-bold text-[var(--psm-text)]">
                  {distributions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sections */}
      {activeTab === 'contents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Report Section Snapshots ({sections.length})
            </h2>
            <span className="text-xs text-[var(--psm-muted)]">
              Sealed content frozen at validation time
            </span>
          </div>

          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
              No sections captured. Click &quot;Validate Sources&quot; to build section snapshots.
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--psm-primary)]">
                        Section 0{idx + 1}
                      </span>
                      <span className="font-bold text-[var(--psm-text)]">
                        {sec.section_title}
                      </span>
                    </div>
                    <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--psm-muted)]">
                      {sec.section_key}
                    </span>
                  </div>
                  <div className="mt-3">
                    <pre className="max-h-48 overflow-y-auto rounded-lg bg-[var(--psm-surface-2)] p-3 font-mono text-[11px] text-[var(--psm-text)]">
                      {JSON.stringify(sec.section_data ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Sources */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Source Manifest & Data Lineage ({sources.length})
            </h2>
            <span className="text-xs text-[var(--psm-muted)]">
              Source module cryptographic verification and audit hashes
            </span>
          </div>

          {sources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
              No source manifest items recorded. Run validation to scan module tables.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                  <tr>
                    <th className="px-4 py-3">Source Module</th>
                    <th className="px-3 py-3">Source Entity</th>
                    <th className="px-3 py-3">Record Count</th>
                    <th className="px-3 py-3">Missing Records</th>
                    <th className="px-3 py-3">Snapshot Timestamp</th>
                    <th className="px-4 py-3">Data Hash (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)]">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                      <td className="px-4 py-3 font-bold text-[var(--psm-text)]">
                        {src.source_module_code}
                      </td>
                      <td className="px-3 py-3 text-[var(--psm-muted)] font-mono">
                        {src.source_table_or_view}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[var(--psm-text)]">
                        {src.record_count}
                      </td>
                      <td className="px-3 py-3">
                        {src.missing_record_count > 0 ? (
                          <span className="font-bold text-amber-500">
                            {src.missing_record_count}
                          </span>
                        ) : (
                          <span className="text-emerald-500">0</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[11px] text-[var(--psm-muted)]">
                        {src.snapshot_at ? new Date(src.snapshot_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-[var(--psm-muted)]">
                        {src.data_hash ? src.data_hash.slice(0, 16) + '...' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Readiness */}
      {activeTab === 'readiness' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Evidence Completeness Evaluation
            </h2>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Checks whether all mandatory source tables returned complete observations and verify integrity.
            </p>
            <div className="mt-4 flex items-center gap-6">
              <ExecutiveReportReadinessGauge
                score={readiness?.score ?? report.overall_readiness_score ?? 90}
                missingSourcesCount={readiness?.missingCount ?? 0}
              />
              <div className="space-y-1.5 text-xs">
                <div>
                  Readiness Status:{' '}
                  <strong className="text-emerald-500">{readiness?.status ?? 'READY'}</strong>
                </div>
                <div>
                  Missing Source Gaps:{' '}
                  <strong className="text-[var(--psm-text)]">{readiness?.missingCount ?? 0}</strong>
                </div>
                <div>
                  Blocking Issues:{' '}
                  <strong className="text-emerald-500">{readiness?.blockersCount ?? 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Artifacts */}
      {activeTab === 'artifacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Generated Report Artifacts ({artifacts.length})
            </h2>
            <button
              type="button"
              onClick={() => setGenerateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Generate New Format</span>
            </button>
          </div>

          {artifacts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
              No rendered artifacts yet. Click &quot;Generate New Format&quot; to render PDF, HTML, or JSON.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                  <tr>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-3 py-3">Format</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">File Size</th>
                    <th className="px-3 py-3">SHA-256 Checksum</th>
                    <th className="px-4 py-3 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)]">
                  {artifacts.map((art) => (
                    <tr key={art.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                      <td className="px-4 py-3 font-semibold text-[var(--psm-text)]">
                        {art.file_name}
                      </td>
                      <td className="px-3 py-3">
                        <ReportFormatBadge format={art.artifact_format} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-emerald-500">
                          {art.artifact_status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[var(--psm-muted)]">
                        {art.file_size_bytes ? `${Math.round(art.file_size_bytes / 1024)} KB` : '—'}
                      </td>
                      <td className="px-3 py-3 font-mono text-[10px] text-[var(--psm-muted)]">
                        {art.sha256_checksum ? art.sha256_checksum.slice(0, 16) + '...' : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => mutations.downloadArtifact.mutate(art.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)] transition"
                        >
                          <Download className="h-3 w-3" />
                          <span>Get</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Distribution */}
      {activeTab === 'distribution' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Distribution Records & Access Events ({distributions.length})
            </h2>
            {isApproved && (
              <button
                type="button"
                onClick={() => setDistributeOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Distribution</span>
              </button>
            )}
          </div>

          {distributions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
              This package has not been distributed yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                  <tr>
                    <th className="px-4 py-3">Distribution Code</th>
                    <th className="px-3 py-3">Channel</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Sent At</th>
                    <th className="px-4 py-3 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)]">
                  {distributions.map((d) => (
                    <tr key={d.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-[var(--psm-text)]">
                        {d.distribution_code}
                      </td>
                      <td className="px-3 py-3 text-[var(--psm-muted)]">
                        {d.distribution_channel}
                      </td>
                      <td className="px-3 py-3 font-semibold text-emerald-500">
                        {d.distribution_status}
                      </td>
                      <td className="px-3 py-3 text-[var(--psm-muted)]">
                        {d.sent_at ? new Date(d.sent_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => mutations.revokeDistribution.mutate(d.id)}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[var(--psm-text)]">
            Audit Trail & Sealed History Events
          </h2>
          <div className="space-y-2">
            {historyEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
                No history events recorded for this package.
              </div>
            ) : (
              historyEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[var(--psm-muted)]" />
                    <span className="font-semibold text-[var(--psm-text)]">
                      {String(evt.event_type ?? 'AUDIT_EVENT')}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--psm-muted)]">
                    {evt.created_at ? new Date(String(evt.created_at)).toLocaleString() : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Dialog Modals */}
      <GenerateReportArtifactDialog
        isOpen={generateOpen}
        onClose={() => {
          setGenerateOpen(false);
          artifactsQuery.refetch();
        }}
        reportId={id}
      />

      <SubmitReportApprovalDialog
        isOpen={submitApprovalOpen}
        onClose={() => {
          setSubmitApprovalOpen(false);
          detailQuery.refetch();
        }}
        reportId={id}
      />

      <ApproveReportDialog
        isOpen={approveOpen}
        onClose={() => {
          setApproveOpen(false);
          detailQuery.refetch();
        }}
        reportId={id}
      />

      <DistributeReportDialog
        isOpen={distributeOpen}
        onClose={() => {
          setDistributeOpen(false);
          distributionQuery.refetch();
        }}
        reportId={id}
      />
    </main>
  );
}
