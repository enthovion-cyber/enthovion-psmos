'use client';

import React from 'react';
import type { ExecutiveRepeatIssue } from '../../types/executive-trend.types';

interface Props {
  issues: ExecutiveRepeatIssue[];
  title?: string;
}

export function ExecutiveRepeatIssueBubbleChart({
  issues = [],
  title = 'Repeat Issue Clustering by Module & Severity',
}: Props) {
  if (!issues.length) {
    return (
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 text-center text-xs text-[var(--psm-muted)]">
        No repeat issue occurrences detected.
      </div>
    );
  }

  // Aggregate by primary source module
  const moduleMap: Record<
    string,
    { totalOccurrences: number; count: number; criticalCount: number; issues: ExecutiveRepeatIssue[] }
  > = {};

  issues.forEach((iss) => {
    const mod = iss.primary_source_module || 'Unassigned';
    if (!moduleMap[mod]) {
      moduleMap[mod] = { totalOccurrences: 0, count: 0, criticalCount: 0, issues: [] };
    }
    moduleMap[mod].totalOccurrences += iss.occurrence_count || 1;
    moduleMap[mod].count += 1;
    if (iss.executive_priority === 'Critical' || iss.source_criticality === 'Critical') {
      moduleMap[mod].criticalCount += 1;
    }
    moduleMap[mod].issues.push(iss);
  });

  const modules = Object.entries(moduleMap).sort(
    (a, b) => b[1].totalOccurrences - a[1].totalOccurrences
  );

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div>
          <h3 className="text-base font-bold text-[var(--psm-text)]">{title}</h3>
          <p className="text-xs text-[var(--psm-muted)]">
            Grouping of {issues.length} detected repeat patterns across PSM systems
          </p>
        </div>
        <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-500">
          {issues.filter((i) => i.repeat_status === 'Confirmed Repeat').length} Confirmed
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(([modName, stats], idx) => {
          const hasCritical = stats.criticalCount > 0;
          return (
            <div
              key={idx}
              className={`rounded-xl border p-4 transition ${
                hasCritical
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--psm-primary)]">
                  {modName}
                </span>
                <span className="rounded-full bg-[var(--psm-surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--psm-text)]">
                  {stats.totalOccurrences} occurrences
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-[var(--psm-text)]">
                {stats.count} repeat pattern{stats.count > 1 ? 's' : ''}
              </p>

              <div className="mt-2 flex items-center justify-between text-xs text-[var(--psm-muted)]">
                <span>Critical: {stats.criticalCount}</span>
                <span>
                  Sites affected:{' '}
                  {new Set(stats.issues.flatMap((i) => i.affected_sites_count || 1)).size}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
