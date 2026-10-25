'use client';

import React from 'react';
import {
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Award,
} from 'lucide-react';

export interface BoardAssurancePillar {
  key: string;
  title: string;
  status: 'Normal' | 'Watch' | 'Critical';
  score?: number | string;
  metricLabel: string;
  trend: 'improving' | 'worsening' | 'stable';
  highlightText: string;
}

export function ExecutiveBoardAssuranceMatrix({
  pillars = [
    {
      key: 'overall-health',
      title: 'PSM Governance Health',
      status: 'Normal',
      score: '84.6%',
      metricLabel: 'Enterprise Health Index',
      trend: 'improving',
      highlightText: '+4.2% trajectory over 6 months across 5 operating sites.',
    },
    {
      key: 'critical-risks',
      title: 'Catastrophic Risk Backlog',
      status: 'Normal',
      score: '6 Active',
      metricLabel: 'Unmitigated Critical Risks',
      trend: 'improving',
      highlightText: 'Reduced from 18 in May 2026. Zero unacknowledged cases.',
    },
    {
      key: 'barrier-integrity',
      title: 'Safety-Critical Barriers',
      status: 'Watch',
      score: '4 Impaired',
      metricLabel: 'Active Barrier Bypasses',
      trend: 'stable',
      highlightText: '4 hardware barriers impaired under approved operational containment.',
    },
    {
      key: 'overdue-capa',
      title: 'Critical CAPA & Actions',
      status: 'Normal',
      score: '9 Overdue',
      metricLabel: 'Universal Action Backlog',
      trend: 'improving',
      highlightText: '73% reduction compared to Q2 baseline; only 2 chronic items.',
    },
    {
      key: 'repeat-weaknesses',
      title: 'Recurring Safety Clusters',
      status: 'Watch',
      score: '3 Clusters',
      metricLabel: 'Multi-Site Repeat Patterns',
      trend: 'worsening',
      highlightText: 'PSV relief chatter and MOC extensions flagged for corporate audit.',
    },
    {
      key: 'governance-commitments',
      title: 'Board / Review Commitments',
      status: 'Normal',
      score: '100%',
      metricLabel: 'Decision SLA Adherence',
      trend: 'stable',
      highlightText: 'Zero executive escalation SLA breaches in current period.',
    },
  ],
}: {
  pillars?: BoardAssurancePillar[];
}) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--psm-text)]">Board PSM Assurance Matrix</h3>
          <p className="text-xs text-[var(--psm-muted)]">Core process safety governance pillars evaluated for board oversight.</p>
        </div>
        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-400">
          6 Core Pillars
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => {
          const isCritical = p.status === 'Critical';
          const isWatch = p.status === 'Watch';
          const badgeClass = isCritical
            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            : isWatch
            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

          return (
            <div
              key={p.key}
              className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--psm-text)]">{p.title}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                    {p.status}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[var(--psm-text)]">{p.score}</span>
                  <span className="text-[11px] text-[var(--psm-muted)]">{p.metricLabel}</span>
                </div>

                <p className="mt-2 text-xs text-[var(--psm-muted)] leading-relaxed">
                  {p.highlightText}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--psm-line)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--psm-muted)]">Trajectory:</span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    p.trend === 'improving'
                      ? 'text-emerald-500'
                      : p.trend === 'worsening'
                      ? 'text-rose-500'
                      : 'text-blue-400'
                  }`}
                >
                  {p.trend === 'improving' ? (
                    <TrendingUp size={13} />
                  ) : p.trend === 'worsening' ? (
                    <TrendingDown size={13} />
                  ) : (
                    <Activity size={13} />
                  )}
                  <span className="capitalize">{p.trend}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
