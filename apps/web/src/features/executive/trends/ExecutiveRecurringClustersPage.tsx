'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GitBranch,
  ShieldAlert,
  Flame,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  BookmarkPlus,
} from 'lucide-react';
import {
  useExecutiveRecurringClusters,
  useExecutiveTrendMutations,
} from '../hooks/useExecutiveTrends';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import {
  RecurringClusterStatusBadge,
} from './ExecutiveTrendBadges';
import { AddToManagementReviewDialog } from './ExecutiveTrendDialogs';
import type { ExecutiveRecurringCluster } from '../types/executive-trend.types';

export function ExecutiveRecurringClustersPage() {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [mgmtReviewCluster, setMgmtReviewCluster] = useState<ExecutiveRecurringCluster | null>(null);

  const query = useExecutiveRecurringClusters();
  const clusters = query.data?.rows ?? [];

  const filtered = clusters.filter((c) => {
    if (filterSeverity === 'all') return true;
    return c.cluster_severity === filterSeverity;
  });

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Recurring Safety Weakness Clusters"
        subtitle="Cross-site systemic aggregations of repeat issues indicating organizational, design, or cultural safety gaps."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
            Severity Filter:
          </label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs text-[var(--psm-text)] focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>

        <span className="text-xs text-[var(--psm-muted)]">
          Total Clusters: <strong className="text-[var(--psm-text)]">{filtered.length}</strong>
        </span>
      </div>

      {/* Cluster Cards */}
      <section className="grid gap-4 md:grid-cols-2">
        {filtered.length > 0 ? (
          filtered.map((cluster) => (
            <div
              key={cluster.id}
              className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--psm-primary)]">
                      {cluster.cluster_code}
                    </span>
                    <RecurringClusterStatusBadge status={cluster.cluster_status} />
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      cluster.cluster_severity === 'Critical'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {cluster.cluster_severity}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-[var(--psm-text)]">{cluster.cluster_title}</h3>
                <p className="mt-1 text-xs text-[var(--psm-muted)]">
                  {cluster.cluster_description || 'Systemic safety vulnerability detected across multiple operational facilities.'}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--psm-muted)]">Affected Sites</span>
                    <p className="font-bold text-[var(--psm-text)]">{cluster.affected_sites_count} Facilities</p>
                  </div>
                  <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--psm-muted)]">Total Occurrences</span>
                    <p className="font-bold text-rose-500">{cluster.total_occurrences} Incidents/Events</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--psm-line)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--psm-muted)]">
                  Primary Module: <strong className="text-[var(--psm-text)]">{cluster.primary_module_code || 'Enterprise'}</strong>
                </span>
                <button
                  onClick={() => setMgmtReviewCluster(cluster)}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--psm-text)] hover:opacity-80"
                >
                  <BookmarkPlus size={13} />
                  <span>Escalate to Governance</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
            No recurring cross-site clusters detected in the current historical window.
          </div>
        )}
      </section>

      <AddToManagementReviewDialog
        isOpen={Boolean(mgmtReviewCluster)}
        onClose={() => setMgmtReviewCluster(null)}
        target={mgmtReviewCluster}
        targetType="cluster"
      />
    </main>
  );
}
