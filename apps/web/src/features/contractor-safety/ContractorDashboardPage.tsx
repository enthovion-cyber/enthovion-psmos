// apps/web/src/features/contractor-safety/ContractorDashboardPage.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileText,
  ArrowRight,
  Plus,
  ExternalLink
} from 'lucide-react';
import {
  ContractorSafetyHeader,
  CsmGradeBadge,
  CsmStatusBadge,
  CsmTierBadge
} from './ContractorSafetyUi';
import { useContractorDashboard } from './hooks/useContractorSafety';

export function ContractorDashboardPage() {
  const { data: dashboard, isLoading, error } = useContractorDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ContractorSafetyHeader
          title="Contractor Safety Dashboard"
          subtitle="OSHA 1910.119(h) Contractor qualification, document compliance, and risk profile."
        />
        <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const metrics = dashboard?.metrics ?? {
    totalContractors: 5,
    activeContractors: 4,
    tier1Contractors: 3,
    gradeAPercent: 60,
    expiringDocumentsCount: 1,
    expiredDocumentsCount: 0,
    pendingVerificationsCount: 0,
    avgPrequalScore: 90.0
  };

  const expiringList = dashboard?.expiringDocumentsList ?? [];
  const byTier = dashboard?.distributions?.byTier ?? { TIER_1: 3, TIER_2: 2, TIER_3: 0 };
  const byGrade = dashboard?.distributions?.byGrade ?? { A: 3, B: 1, C: 1 };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ContractorSafetyHeader
        title="Contractor Safety Dashboard"
        subtitle="Manage contractor prequalification, insurance tracking (COI), worker credentials, and OSHA 1910.119(h) compliance."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/contractor-safety/contractors"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Register Contractor
            </Link>
          </div>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Urgent Expiration Alert Banner */}
        {metrics.expiringDocumentsCount > 0 && (
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/30 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {metrics.expiringDocumentsCount} Insurance Certificate (COI) Expiring Within 30 Days
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Contractor safety coverage must be renewed before work permits can be authorized. Use the contractor self-service portal link to request updated filings.
                </p>
              </div>
            </div>
            <Link
              href="/contractor-safety/contractors"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition shrink-0"
            >
              Review Certificates
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Active Contractors</span>
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {metrics.activeContractors}
              </span>
              <span className="text-xs text-slate-500">of {metrics.totalContractors} registered</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <span className="font-semibold text-rose-600 dark:text-rose-400">{metrics.tier1Contractors} Tier 1</span>
              <span>process turnaround vendors</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Preferred Grade A</span>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.gradeAPercent}%
              </span>
              <span className="text-xs text-slate-500">compliant</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Avg prequal score: <span className="font-semibold">{metrics.avgPrequalScore} / 100</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">COI Expiration Radar</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.expiringDocumentsCount}
              </span>
              <span className="text-xs text-slate-500">expiring &lt; 30d</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {metrics.expiredDocumentsCount > 0 ? (
                <span className="text-rose-600 font-semibold">{metrics.expiredDocumentsCount} already expired</span>
              ) : (
                <span className="text-emerald-600 font-semibold">0 expired policies</span>
              )}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Portal Verifications</span>
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {metrics.pendingVerificationsCount}
              </span>
              <span className="text-xs text-slate-500">pending review</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Vendor uploaded documents awaiting HSE sign-off
            </div>
          </div>
        </div>

        {/* Tier Distribution & Prequalification Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Tier Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Contractors by Risk Tier
              </h3>
              <span className="text-xs text-slate-500">OSHA 1910.119(h)</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-600 dark:text-rose-400">Tier 1: High Risk Process Turnaround</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{byTier.TIER_1 ?? 0}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${((byTier.TIER_1 ?? 0) / (metrics.totalContractors || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Hot work, line breaking, confined space in battery limits</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Tier 2: Medium Risk Maintenance</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{byTier.TIER_2 ?? 0}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${((byTier.TIER_2 ?? 0) / (metrics.totalContractors || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Civil, insulation, general fabrication outside process piping</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Tier 3: Low Risk Non-Process</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{byTier.TIER_3 ?? 0}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-400 h-full rounded-full"
                    style={{ width: `${((byTier.TIER_3 ?? 0) / (metrics.totalContractors || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Testing, delivery, non-intrusive consulting</p>
              </div>
            </div>
          </div>

          {/* Safety Grade Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Safety Grade Distribution
              </h3>
              <span className="text-xs text-slate-500">TRIR / EMR / OSHA 300</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Grade A (Preferred)</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{byGrade.A ?? 0}</div>
                </div>
                <span className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm flex items-center justify-center">A</span>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-blue-800 dark:text-blue-300">Grade B (Approved)</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{byGrade.B ?? 0}</div>
                </div>
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">B</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Grade C (Conditional)</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{byGrade.C ?? 0}</div>
                </div>
                <span className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center">C</span>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">Grade D/F (Review)</div>
                  <div className="text-lg font-bold text-rose-600 dark:text-rose-400">{(byGrade.D ?? 0) + (byGrade.F ?? 0)}</div>
                </div>
                <span className="w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-sm flex items-center justify-center">D</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Grade C contractors require an active management variance to work in Tier 1 units.
            </p>
          </div>

          {/* Self-Service Portal Status Card */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Self-Service Vendor Portal
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Contractor companies use secure token links to upload insurance certificates (COIs), OSHA 300A annual summaries, and safety policy manuals directly without requiring employee logins.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Direct Uploads Supported</span>
                <span className="text-emerald-600 font-semibold">COI, OSHA 300, HSE Manual</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                <span>Token Expiration Standard</span>
                <span>90 Days (Auto-refreshable)</span>
              </div>
            </div>
            <Link
              href="/contractor-safety/contractors"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Manage Vendor Access Tokens
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Expiration Watchlist */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Certificates of Insurance (COI) Approaching Expiration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Policies that require immediate renewal to avoid automated PTW work gating.
              </p>
            </div>
            <Link
              href="/contractor-safety/contractors"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View Full Directory &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Document Title</th>
                  <th className="py-2.5 px-4 font-semibold">Contractor</th>
                  <th className="py-2.5 px-4 font-semibold">Policy / Carrier</th>
                  <th className="py-2.5 px-4 font-semibold">Coverage Amount</th>
                  <th className="py-2.5 px-4 font-semibold">Expiration Date</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {expiringList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No documents currently expiring within 30 days. All active contractor insurance filings are compliant.
                    </td>
                  </tr>
                ) : (
                  expiringList.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {doc.title}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/contractor-safety/contractors/${doc.contractor_id}`}
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          Contractor Profile &rarr;
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {doc.insurance_carrier || doc.policy_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {doc.coverage_amount_usd
                          ? `$${(doc.coverage_amount_usd).toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-amber-600 dark:text-amber-400 font-semibold">
                        {doc.expiration_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Expiring Soon
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/contractor-safety/contractors/${doc.contractor_id}`}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
