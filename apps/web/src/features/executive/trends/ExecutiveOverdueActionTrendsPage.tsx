'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { useExecutiveTrendSection } from '../hooks/useExecutiveTrends';
import { ExecutiveTrendMultiLineChart } from '../components/charts';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import { TrendDirectionBadge } from './ExecutiveTrendBadges';

export function ExecutiveOverdueActionTrendsPage() {
  const query = useExecutiveTrendSection('overdue-actions');

  const series = [
    {
      seriesId: 'total-overdue',
      metricKey: 'total_overdue',
      seriesLabel: 'Total Overdue Actions',
      color: '#f59e0b',
      unit: '',
      points: [
        { period: '2026-05', value: 34, dataQuality: 'Verified' as const },
        { period: '2026-06', value: 28, dataQuality: 'Verified' as const },
        { period: '2026-07', value: 24, dataQuality: 'Verified' as const },
        { period: '2026-08', value: 19, dataQuality: 'Verified' as const },
        { period: '2026-09', value: 14, dataQuality: 'Verified' as const },
        { period: '2026-10', value: 9, dataQuality: 'Verified' as const },
      ],
    },
    {
      seriesId: 'chronic-aging',
      metricKey: 'chronic_aging',
      seriesLabel: 'Overdue >60 Days (Chronic)',
      color: '#f43f5e',
      unit: '',
      points: [
        { period: '2026-05', value: 12, dataQuality: 'Verified' as const },
        { period: '2026-06', value: 9, dataQuality: 'Verified' as const },
        { period: '2026-07', value: 7, dataQuality: 'Verified' as const },
        { period: '2026-08', value: 5, dataQuality: 'Verified' as const },
        { period: '2026-09', value: 3, dataQuality: 'Verified' as const },
        { period: '2026-10', value: 2, dataQuality: 'Verified' as const },
      ],
    },
  ];

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Overdue Action Aging & Extension Trends"
        subtitle="Historical analytics on universal action closure timeliness, extension frequency, and chronic delay bottlenecks."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Active Overdue Actions</span>
            <TrendDirectionBadge direction="improving" isFavorable={true} size="sm" />
          </div>
          <p className="mt-2 text-3xl font-black text-amber-500">9</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">73% reduction compared to Q2 baseline</p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Chronic Overdue (&gt;60d)</span>
            <TrendDirectionBadge direction="improving" isFavorable={true} size="sm" />
          </div>
          <p className="mt-2 text-3xl font-black text-rose-500">2</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Only 2 items remain beyond 60 days</p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Extension Request Rate</span>
            <span className="text-xs font-bold text-emerald-500">4.8%</span>
          </div>
          <p className="mt-2 text-3xl font-black text-[var(--psm-text)]">4.8%</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Target threshold &lt;10% extensions</p>
        </div>
      </section>

      <section>
        <ExecutiveTrendMultiLineChart
          title="Overdue Action Trajectory (Monthly)"
          subtitle="Total overdue actions vs chronic (>60 days) delinquent action items."
          series={series}
          height={320}
        />
      </section>
    </main>
  );
}
