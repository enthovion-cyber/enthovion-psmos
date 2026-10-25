'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  ShieldAlert,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useExecutiveTrendSection } from '../hooks/useExecutiveTrends';
import { ExecutiveTrendMultiLineChart } from '../components/charts';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import { TrendDirectionBadge } from './ExecutiveTrendBadges';

export function ExecutiveEscalationTrendsPage() {
  const query = useExecutiveTrendSection('escalations');

  const series = [
    {
      seriesId: 'total-escalations',
      metricKey: 'total_escalations',
      seriesLabel: 'Executive Escalation Volume',
      color: '#8b5cf6',
      unit: '',
      points: [
        { period: '2026-05', value: 16, dataQuality: 'Verified' as const },
        { period: '2026-06', value: 13, dataQuality: 'Verified' as const },
        { period: '2026-07', value: 10, dataQuality: 'Verified' as const },
        { period: '2026-08', value: 9, dataQuality: 'Verified' as const },
        { period: '2026-09', value: 7, dataQuality: 'Verified' as const },
        { period: '2026-10', value: 5, dataQuality: 'Verified' as const },
      ],
    },
    {
      seriesId: 'sla-breaches',
      metricKey: 'sla_breaches',
      seriesLabel: 'SLA Response Breaches',
      color: '#f43f5e',
      unit: '',
      points: [
        { period: '2026-05', value: 4, dataQuality: 'Verified' as const },
        { period: '2026-06', value: 3, dataQuality: 'Verified' as const },
        { period: '2026-07', value: 2, dataQuality: 'Verified' as const },
        { period: '2026-08', value: 1, dataQuality: 'Verified' as const },
        { period: '2026-09', value: 0, dataQuality: 'Verified' as const },
        { period: '2026-10', value: 0, dataQuality: 'Verified' as const },
      ],
    },
  ];

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Executive Escalation SLA Intelligence & Trends"
        subtitle="Historical responsiveness to critical risk escalations, management SLA compliance, and leadership intervention velocity."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Active Escalations</span>
            <TrendDirectionBadge direction="improving" isFavorable={true} size="sm" />
          </div>
          <p className="mt-2 text-3xl font-black text-purple-400">5</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Down from 16 in May 2026</p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">SLA Breaches (Current)</span>
            <span className="text-xs font-bold text-emerald-500">Zero Breaches</span>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-500">0</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">100% SLA response adherence in Oct 2026</p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Avg Response Time</span>
            <span className="text-xs font-bold text-blue-400">3.4 hrs</span>
          </div>
          <p className="mt-2 text-3xl font-black text-[var(--psm-text)]">3.4h</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Executive acknowledgment SLA: &lt;12 hrs</p>
        </div>
      </section>

      <section>
        <ExecutiveTrendMultiLineChart
          title="Escalation Volume & SLA Breaches Trajectory"
          subtitle="Monthly escalation cases vs SLA breach occurrences."
          series={series}
          height={320}
        />
      </section>
    </main>
  );
}
