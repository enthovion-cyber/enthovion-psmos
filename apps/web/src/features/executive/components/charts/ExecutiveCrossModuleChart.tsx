'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, ExternalLink, Filter } from 'lucide-react';
import type { ExecutiveModuleHealth } from '../../types/executive-kpi.types';
import { ExecutiveStatusBadge } from '../shared/ExecutiveStatusBadge';

interface Props {
  modules: ExecutiveModuleHealth[];
}

export function ExecutiveCrossModuleChart({ modules }: Props) {
  const [filter, setFilter] = useState<'all' | 'needs-attention' | 'healthy'>('all');

  const filtered = modules.filter((m) => {
    if (filter === 'healthy') return m.healthStatus === 'Healthy' || m.healthStatus === 'Good';
    if (filter === 'needs-attention') return m.healthStatus === 'Critical' || m.healthStatus === 'High Risk' || m.healthStatus === 'Monitor' || m.healthStatus === 'Warning';
    return true;
  });

  const getScoreWidth = (score?: number | null) => {
    if (typeof score !== 'number') return 0;
    return Math.min(Math.max(score, 5), 100);
  };

  const getBarColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'good':
        return 'bg-emerald-500';
      case 'monitor':
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
      case 'high risk':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400 dark:bg-slate-600';
    }
  };

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--psm-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--psm-primary)]/10 p-1.5 text-[var(--psm-primary)]">
              <BarChart3 size={16} />
            </span>
            <h3 className="text-base font-bold text-[var(--psm-text)]">
              Cross-Module Health Scoring Distribution
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Computed foundation scores (0–100) reflecting real operational health across connected plant modules.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded px-2.5 py-1 font-medium transition ${filter === 'all' ? 'bg-[var(--psm-surface)] text-[var(--psm-text)] shadow-sm' : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'}`}
          >
            All ({modules.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('needs-attention')}
            className={`rounded px-2.5 py-1 font-medium transition ${filter === 'needs-attention' ? 'bg-[var(--psm-surface)] text-[var(--psm-text)] shadow-sm' : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'}`}
          >
            Attention Required
          </button>
          <button
            type="button"
            onClick={() => setFilter('healthy')}
            className={`rounded px-2.5 py-1 font-medium transition ${filter === 'healthy' ? 'bg-[var(--psm-surface)] text-[var(--psm-text)] shadow-sm' : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'}`}
          >
            Healthy
          </button>
        </div>
      </div>

      {/* Module Bar Chart Rows */}
      <div className="mt-4 space-y-3.5">
        {filtered.map((module) => {
          const score = typeof module.healthScoreFoundation === 'number' ? module.healthScoreFoundation : null;
          const barWidth = getScoreWidth(score);
          const barColor = getBarColor(module.healthStatus);

          return (
            <div key={module.moduleKey} className="group rounded-lg p-2 transition hover:bg-[var(--psm-surface-2)]">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Link
                    href={module.drilldownRoute ?? `/executive/module-health/${module.moduleKey}`}
                    className="font-semibold text-[var(--psm-text)] group-hover:text-[var(--psm-primary)] flex items-center gap-1 transition"
                  >
                    <span>{module.moduleName}</span>
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition" />
                  </Link>
                  <ExecutiveStatusBadge status={module.healthStatus} />
                </div>

                <div className="flex items-center gap-3 text-[11px] text-[var(--psm-muted)]">
                  {module.criticalOpenItems > 0 && (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {module.criticalOpenItems} Critical
                    </span>
                  )}
                  {module.overdueItems > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {module.overdueItems} Overdue
                    </span>
                  )}
                  <span className="font-bold text-sm text-[var(--psm-text)]">
                    {score !== null ? `${score}/100` : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)]/40">
                <div
                  style={{ width: `${barWidth}%` }}
                  className={`h-full rounded-full ${barColor} transition-all duration-700`}
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--psm-muted)]">
                <span>{module.reason ?? 'Server aggregated adapter'}</span>
                <span>Target: &ge; 85</span>
              </div>
            </div>
          );
        })}

        {!filtered.length && (
          <p className="py-6 text-center text-xs text-[var(--psm-muted)]">
            {!modules.length
              ? 'Awaiting module aggregation run across 14 PSM operational modules.'
              : 'No modules match the selected filter.'}
          </p>
        )}
      </div>
    </section>
  );
}
