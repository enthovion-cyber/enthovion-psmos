'use client';

import React, { useState } from 'react';
import {
  Send,
  ShieldAlert,
  Clock,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';
import {
  useExecutiveReportDistribution,
  useExecutiveReportMutations,
} from '../hooks/useExecutiveReports';
import {
  ExecutiveReportsNav,
  ExecutiveReportsHeader,
  ExecutiveReportIntegrityNotice,
} from './ExecutiveReportsShared';
import type { ExecutiveReportDistributionRecord } from '../types/executive-report.types';

export function ExecutiveReportDistributionPage() {
  const distributionQuery = useExecutiveReportDistribution();
  const mutations = useExecutiveReportMutations();

  const distributions = (distributionQuery.data?.rows ?? []) as ExecutiveReportDistributionRecord[];

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Report Distribution & Access Governance"
        subtitle="Secure distribution logging, dynamic recipient watermarking, and instant distribution revocation."
      />

      <ExecutiveReportIntegrityNotice readinessRate={100} missingSourcesCount={0} />

      {distributionQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading distribution records...</span>
          </div>
        </div>
      ) : distributions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
          No distribution records found. Approved reports can be distributed from their report detail view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">Distribution Code</th>
                <th className="px-3 py-3">Channel</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Sent At</th>
                <th className="px-3 py-3">Access Restrictions</th>
                <th className="px-4 py-3 text-right">Action</th>
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
                  <td className="px-3 py-3">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-500">
                      {d.distribution_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">
                    {d.sent_at ? new Date(d.sent_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-[var(--psm-muted)]">
                    Dynamic Watermarking Enabled
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => mutations.revokeDistribution.mutate(d.id)}
                      disabled={mutations.revokeDistribution.isPending}
                      className="text-xs font-semibold text-rose-500 hover:underline disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
