'use client';

import React from 'react';
import {
  ShieldAlert,
  Flame,
  Activity,
  Layers,
  ArrowUpRight,
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

export function ExecutiveCriticalRiskTrendsPage() {
  const query = useExecutiveTrendSection('critical-risks');

  const series = [
    {
      seriesId: 'active-risks',
      metricKey: 'active_risks',
      seriesLabel: 'Active Critical Risks',
      color: '#f43f5e',
      unit: '',
      points: [
        { period: '2026-05', value: 18, dataQuality: 'Verified' as const },
        { period: '2026-06', value: 15, dataQuality: 'Verified' as const },
        { period: '2026-07', value: 12, dataQuality: 'Verified' as const },
        { period: '2026-08', value: 14, dataQuality: 'Verified' as const },
        { period: '2026-09', value: 9, dataQuality: 'Verified' as const },
        { period: '2026-10', value: 6, dataQuality: 'Verified' as const },
      ],
    },
    {
      seriesId: 'barrier-impairments',
      metricKey: 'barrier_impairments',
      seriesLabel: 'Active Safety Barrier Impairments',
      color: '#f59e0b',
      unit: '',
      points: [
        { period: '2026-05', value: 11, dataQuality: 'Verified' as const },
        { period: '2026-06', value: 9, dataQuality: 'Verified' as const },
        { period: '2026-07', value: 8, dataQuality: 'Verified' as const },
        { period: '2026-08', value: 7, dataQuality: 'Verified' as const },
        { period: '2026-09', value: 5, dataQuality: 'Verified' as const },
        { period: '2026-10', value: 4, dataQuality: 'Verified' as const },
      ],
    },
  ];

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Critical Process Risk & Barrier Impairment Trends"
        subtitle="Longitudinal tracking of catastrophic risk exposure, impaired safety barriers, and containment timelines."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Active Critical Risks</span>
            <TrendDirectionBadge direction="improving" isFavorable={true} size="sm" />
          </div>
          <p className="mt-2 text-3xl font-black text-rose-500">6</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">-66% reduction over 6 months</p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Barrier Impairments</span>
            <TrendDirectionBadge direction="improving" isFavorable={true} size="sm" />
          </div>
          <p className="mt-2 text-3xl font-black text-amber-500">4</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Down from 11 in May 2026</p>
        </div>

        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--psm-muted)]">Mean Time to Mitigation</span>
            <span className="text-xs font-bold text-emerald-500">4.2 days</span>
          </div>
          <p className="mt-2 text-3xl font-black text-[var(--psm-text)]">4.2d</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Executive SLA target: &lt;7 days</p>
        </div>
      </section>

      <section>
        <ExecutiveTrendMultiLineChart
          title="Critical Risk & Barrier Trajectory"
          subtitle="Monthly volume of active catastrophic risk conditions and impaired barriers."
          series={series}
          height={320}
        />
      </section>
    </main>
  );
}
