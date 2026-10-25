'use client';

import React, { useState } from 'react';
import { Clock, AlertTriangle, ShieldAlert, Calendar, CheckCircle2 } from 'lucide-react';
import type { ExecutiveOverdueAction } from '../../types/executive-critical-risk.types';

interface Props {
  actions: ExecutiveOverdueAction[];
}

export function ExecutiveOverdueAgingChart({ actions }: Props) {
  const [view, setView] = useState<'aging' | 'priority'>('aging');

  // Aging distribution
  const under7 = actions.filter((a) => a.overdue_days < 7).length;
  const days7to14 = actions.filter((a) => a.overdue_days >= 7 && a.overdue_days < 15).length;
  const days15to30 = actions.filter((a) => a.overdue_days >= 15 && a.overdue_days < 31).length;
  const days31to60 = actions.filter((a) => a.overdue_days >= 31 && a.overdue_days < 61).length;
  const over60 = actions.filter((a) => a.overdue_days >= 61).length;
  const total = actions.length;

  // Priority distribution
  const critical = actions.filter((a) => /critical|safety-critical/i.test(String(a.action_priority ?? a.severity ?? ''))).length;
  const high = actions.filter((a) => /high/i.test(String(a.action_priority ?? a.severity ?? ''))).length;
  const medium = actions.filter((a) => /medium/i.test(String(a.action_priority ?? a.severity ?? ''))).length;
  const other = total - critical - high - medium;

  const agingBuckets = [
    { label: '< 7 Days', count: under7, color: 'bg-emerald-500', barColor: '#10b981', textColor: 'text-emerald-500' },
    { label: '7 - 14 Days', count: days7to14, color: 'bg-sky-500', barColor: '#0ea5e9', textColor: 'text-sky-500' },
    { label: '15 - 30 Days', count: days15to30, color: 'bg-amber-500', barColor: '#f59e0b', textColor: 'text-amber-500' },
    { label: '31 - 60 Days', count: days31to60, color: 'bg-orange-500', barColor: '#f97316', textColor: 'text-orange-500' },
    { label: '> 60 Days (Stale)', count: over60, color: 'bg-rose-500', barColor: '#ef4444', textColor: 'text-rose-500' },
  ];

  const priorityBuckets = [
    { label: 'Safety-Critical', count: critical, color: 'bg-rose-600', barColor: '#dc2626', textColor: 'text-rose-600' },
    { label: 'High Priority', count: high, color: 'bg-amber-500', barColor: '#f59e0b', textColor: 'text-amber-500' },
    { label: 'Medium Priority', count: medium, color: 'bg-sky-500', barColor: '#0ea5e9', textColor: 'text-sky-500' },
    { label: 'Standard / Other', count: Math.max(0, other), color: 'bg-slate-400', barColor: '#94a3b8', textColor: 'text-slate-400' },
  ];

  const activeBuckets = view === 'aging' ? agingBuckets : priorityBuckets;
  const maxCount = Math.max(...activeBuckets.map((b) => b.count), 1);

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="text-[var(--psm-primary)]" size={20} />
            <h3 className="font-semibold text-[var(--psm-text)]">Overdue Action Aging Distribution</h3>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Tracking {total} unresolved overdue process safety actions by aging and risk priority.
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView('aging')}
            className={`rounded-md px-3 py-1.5 transition ${
              view === 'aging' ? 'bg-[var(--psm-primary)] text-white shadow-xs' : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
            }`}
          >
            Aging Buckets
          </button>
          <button
            type="button"
            onClick={() => setView('priority')}
            className={`rounded-md px-3 py-1.5 transition ${
              view === 'priority' ? 'bg-[var(--psm-primary)] text-white shadow-xs' : 'text-[var(--psm-muted)] hover:text-[var(--psm-text)]'
            }`}
          >
            Priority Levels
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 size={36} className="text-emerald-500" />
          <p className="mt-2 text-sm font-medium text-[var(--psm-text)]">No Overdue Actions Recorded</p>
          <p className="text-xs text-[var(--psm-muted)]">All corrective actions and recommendations are within their required SLAs.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Visual Percentage Progress Strip */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)] flex">
            {activeBuckets.map((b) => {
              const widthPct = total ? (b.count / total) * 100 : 0;
              if (widthPct === 0) return null;
              return (
                <div
                  key={b.label}
                  style={{ width: `${widthPct}%`, backgroundColor: b.barColor }}
                  title={`${b.label}: ${b.count} (${widthPct.toFixed(1)}%)`}
                  className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-85"
                />
              );
            })}
          </div>

          {/* Detailed Metric Rows */}
          <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-5">
            {activeBuckets.map((b) => {
              const pct = total ? Math.round((b.count / total) * 100) : 0;
              return (
                <div
                  key={b.label}
                  className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-3 transition hover:border-[var(--psm-primary)]/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--psm-muted)]">{b.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${b.color}`} />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-[var(--psm-text)]">{b.count}</span>
                    <span className="text-xs font-semibold text-[var(--psm-muted)]">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--psm-surface-2)]">
                    <div
                      className={`h-full rounded-full ${b.color}`}
                      style={{ width: `${(b.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
