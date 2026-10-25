'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Clock, FileText, CheckSquare, Layers } from 'lucide-react';
import type { PsmElementDashboard } from '../types/executive-psm-element.types';

interface Props {
  summary: PsmElementDashboard['summary'];
}

export function ExecutivePsmElementSummaryCards({ summary }: Props) {
  const cards = [
    {
      title: 'Healthy Elements',
      value: `${summary.healthyElements} / ${summary.totalElements}`,
      subtitle: `${summary.criticalElements} critical · ${summary.highRiskElements} high risk`,
      icon: ShieldCheck,
      color: summary.criticalElements === 0 ? 'text-emerald-500' : 'text-rose-500',
    },
    {
      title: 'Critical Gaps',
      value: summary.criticalElementGaps,
      subtitle: 'Immediate remediation blockers',
      icon: AlertCircle,
      color: summary.criticalElementGaps === 0 ? 'text-emerald-500' : 'text-rose-500',
    },
    {
      title: 'Overdue Actions',
      value: summary.overdueElementActions,
      subtitle: `${summary.pendingElementApprovals} pending approvals`,
      icon: Clock,
      color: summary.overdueElementActions === 0 ? 'text-emerald-500' : 'text-amber-500',
    },
    {
      title: 'Missing Evidence',
      value: summary.missingEvidence,
      subtitle: `${summary.staleElementRecords} stale records`,
      icon: FileText,
      color: summary.missingEvidence === 0 ? 'text-emerald-500' : 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)]"
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
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
