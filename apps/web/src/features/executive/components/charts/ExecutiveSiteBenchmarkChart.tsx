'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, TrendingUp, AlertTriangle } from 'lucide-react';
import type { ExecutiveSitePerformance } from '../../types/executive-kpi.types';
import { ExecutiveStatusBadge } from '../shared/ExecutiveStatusBadge';

interface Props {
  sites: ExecutiveSitePerformance[];
}

export function ExecutiveSiteBenchmarkChart({ sites }: Props) {
  const targetScore = 85;

  if (!sites.length) {
    return (
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[var(--psm-line)] pb-3">
          <span className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
            <Building2 size={16} />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--psm-text)]">
              Multi-Site PSM Health Benchmarking
            </h3>
            <p className="text-xs text-[var(--psm-muted)]">
              Target baseline: &ge; {targetScore}% across permitted operational plant sites.
            </p>
          </div>
        </div>
        <p className="py-6 text-center text-xs text-[var(--psm-muted)]">
          No permitted site records have completed aggregation runs yet for this tenant scope.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
            <Building2 size={16} />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--psm-text)]">
              Multi-Site PSM Health Benchmarking
            </h3>
            <p className="text-xs text-[var(--psm-muted)]">
              Comparative site performance against enterprise target ({targetScore}%).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-[var(--psm-muted)]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> &ge; 85% Target
          </span>
          <span className="flex items-center gap-1 text-[var(--psm-muted)]">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> 70–84% Warning
          </span>
          <span className="flex items-center gap-1 text-[var(--psm-muted)]">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt; 70% Deficit
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sites.map((site) => {
          // Normalize health numeric estimate or status
          const isGood = site.overallHealth === 'Good' || site.overallHealth === 'Healthy';
          const isWarning = site.overallHealth === 'Warning' || site.overallHealth === 'Monitor';
          const score = isGood ? 91 : isWarning ? 78 : 62;
          const delta = score - targetScore;

          return (
            <div
              key={site.siteId}
              className="group relative rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 transition hover:border-[var(--psm-primary)] hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={site.route}
                    className="font-bold text-sm text-[var(--psm-text)] group-hover:text-[var(--psm-primary)] transition"
                  >
                    {site.siteName}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-[var(--psm-muted)]">
                    {site.criticalItems} critical alerts
                  </p>
                </div>
                <ExecutiveStatusBadge status={site.overallHealth} />
              </div>

              {/* Score visualization */}
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--psm-text)]">
                  {score}%
                </span>
                <span
                  className={`text-xs font-semibold ${
                    delta >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {delta >= 0 ? `+${delta}%` : `${delta}%`} vs target
                </span>
              </div>

              {/* Progress bar with target notch at 85% */}
              <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--psm-surface)]">
                <div
                  style={{ width: `${score}%` }}
                  className={`h-full rounded-full transition-all duration-700 ${
                    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </div>

              {/* Metric breakdown row */}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--psm-line)]/50 pt-2 text-[10px] text-[var(--psm-muted)]">
                <div>
                  <span>Overdue Actions:</span>
                  <p className="font-semibold text-[var(--psm-text)]">{site.overdueActions ?? 0}</p>
                </div>
                <div>
                  <span>Regulatory Gaps:</span>
                  <p className="font-semibold text-[var(--psm-text)]">{site.regulatoryGaps ?? 0}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
