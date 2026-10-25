'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, AlertCircle, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import type { ExecutiveScopePerformance } from '../types/executive-performance.types';
import { ExecutivePerformanceStatusBadge } from '../shared/ExecutivePerformanceStatusBadge';

interface Props {
  moduleScorecards: ExecutiveScopePerformance['moduleScorecards'];
  scopeRecordId?: string | null;
  scopeType?: string;
}

export function ExecutiveScopeModuleScorecardGrid({ moduleScorecards, scopeRecordId, scopeType = 'site' }: Props) {
  if (!moduleScorecards || !moduleScorecards.length) {
    return (
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-sm text-[var(--psm-muted)]">
        No module scorecards available for this scope.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {moduleScorecards.map((card: any) => {
        const score = card.health_score_foundation ?? card.module_health_score_foundation;
        const status = card.module_health_status ?? card.status ?? 'Unavailable';
        const isHealthy = status === 'Healthy' || (score ?? 0) >= 80;

        return (
          <div
            key={card.id ?? card.module_key}
            className="flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">
                  {card.module_key}
                </span>
                <ExecutivePerformanceStatusBadge status={status} />
              </div>

              <h3 className="mt-2 text-base font-bold text-[var(--psm-text)]">
                {card.module_label ?? card.module_key}
              </h3>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--psm-text)]">
                  {score != null ? score : '—'}
                </span>
                <span className="text-xs text-[var(--psm-muted)]">/ 100 Health Score</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--psm-line)] pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--psm-muted)]">
                  <AlertCircle className={`h-3.5 w-3.5 ${card.critical_alert_count > 0 ? 'text-rose-500' : ''}`} />
                  <span>{card.critical_alert_count ?? 0} Alerts</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--psm-muted)]">
                  <Clock className={`h-3.5 w-3.5 ${card.overdue_action_count > 0 ? 'text-amber-500' : ''}`} />
                  <span>{card.overdue_action_count ?? 0} Overdue</span>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-[var(--psm-line)] pt-3">
              <Link
                href={`/executive/performance/${scopeType === 'unit' ? 'units' : 'sites'}/${scopeRecordId}/modules?moduleKey=${card.module_key}`}
                className="flex items-center justify-between text-xs font-semibold text-[var(--psm-primary)] hover:underline"
              >
                <span>Score Details</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
