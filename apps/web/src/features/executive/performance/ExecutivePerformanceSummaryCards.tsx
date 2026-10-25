'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Clock, Database, TrendingUp, TrendingDown } from 'lucide-react';
import type { ExecutiveScopePerformance } from '../types/executive-performance.types';

interface Props {
  scope: ExecutiveScopePerformance;
}

export function ExecutivePerformanceSummaryCards({ scope }: Props) {
  const score = scope.performance_score_foundation;
  const isHealthy = (score ?? 0) >= 80;
  const isWarning = (score ?? 0) >= 60 && (score ?? 0) < 80;

  const cards = [
    {
      title: 'Performance Score',
      value: score != null ? `${score}/100` : 'Unavailable',
      subtitle: scope.performance_status,
      icon: isHealthy ? ShieldCheck : AlertTriangle,
      color: isHealthy ? 'text-emerald-500' : isWarning ? 'text-amber-500' : 'text-rose-500',
      badge: scope.data_quality_status,
    },
    {
      title: 'Critical Alerts',
      value: scope.critical_alert_count,
      subtitle: scope.critical_alert_count === 0 ? 'Optimal (0 active)' : 'Immediate action required',
      icon: AlertCircle,
      color: scope.critical_alert_count === 0 ? 'text-emerald-500' : 'text-rose-500',
    },
    {
      title: 'Overdue Actions',
      value: scope.overdue_action_count,
      subtitle: `${scope.pending_approval_count} pending approvals`,
      icon: Clock,
      color: scope.overdue_action_count === 0 ? 'text-emerald-500' : 'text-amber-500',
    },
    {
      title: 'Stale Records',
      value: scope.stale_record_count,
      subtitle: `${scope.unavailable_module_count} unavailable modules`,
      icon: Database,
      color: scope.stale_record_count === 0 ? 'text-emerald-500' : 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition-all hover:border-[var(--psm-primary)] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--psm-muted)]">
                {card.title}
              </span>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-[var(--psm-text)]">
                {card.value}
              </span>
              {card.badge ? (
                <span className="rounded-full bg-[var(--psm-surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--psm-muted)]">
                  {card.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
