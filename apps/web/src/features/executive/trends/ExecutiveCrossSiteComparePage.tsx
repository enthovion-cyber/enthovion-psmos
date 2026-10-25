'use client';

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import {
  useExecutiveTrendComparisons,
} from '../hooks/useExecutiveTrends';
import { ExecutiveTrendComparisonBarChart } from '../components/charts';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import {
  TrendComparabilityBadge,
} from './ExecutiveTrendBadges';

export function ExecutiveCrossSiteComparePage() {
  const [metricKey, setMetricKey] = useState('overall_psm_health_index');
  const [period, setPeriod] = useState('2026-10');

  const query = useExecutiveTrendComparisons({
    metricKey,
    period,
  });

  const comparisons = query.data?.comparisons ?? [
    {
      targetId: 'site-alpha',
      targetName: 'Alpha Petrochemical Complex',
      baselineValue: 86.4,
      comparisonValue: 88.2,
      delta: 1.8,
      deltaPercentage: 2.1,
      comparabilityStatus: 'Comparable' as const,
      denominatorRationale: 'Operating hours and asset class distribution within 5% variance.',
    },
    {
      targetId: 'site-beta',
      targetName: 'Beta Olefins Unit',
      baselineValue: 79.1,
      comparisonValue: 74.5,
      delta: -4.6,
      deltaPercentage: -5.8,
      comparabilityStatus: 'Partially Comparable' as const,
      denominatorRationale: 'Turnaround activity during Q3 reduced active operational equipment count.',
    },
    {
      targetId: 'site-gamma',
      targetName: 'Gamma Gas Processing Terminal',
      baselineValue: 82.0,
      comparisonValue: 84.1,
      delta: 2.1,
      deltaPercentage: 2.6,
      comparabilityStatus: 'Comparable' as const,
      denominatorRationale: 'Normalized per 100k operational work-hours.',
    },
    {
      targetId: 'site-delta',
      targetName: 'Delta Specialty Chemicals',
      baselineValue: 68.5,
      comparisonValue: 62.0,
      delta: -6.5,
      deltaPercentage: -9.5,
      comparabilityStatus: 'Comparable' as const,
      denominatorRationale: 'High overdue action volume directly reducing health index.',
    },
  ];

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Cross-Site Performance & Trend Comparison"
        subtitle="Side-by-side PSM health metrics with fair-denominator validation and normalized risk scoring."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      {/* Control selectors */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Comparison Metric
            </label>
            <select
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              className="mt-1 block rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
            >
              <option value="overall_psm_health_index">Overall PSM Health Index (%)</option>
              <option value="critical_risks">Active Critical Risk Density</option>
              <option value="overdue_actions">Overdue Action Volume</option>
              <option value="repeat_issues">Repeat Issue Density per Unit</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Observation Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-1 block rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-xs text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
            >
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-Q3">Q3 2026</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs text-[var(--psm-muted)]">
          <Scale size={16} className="text-[var(--psm-primary)]" />
          <span>Fair-denominator validation applied</span>
        </div>
      </div>

      {/* Side-by-Side Comparison Chart */}
      <section>
        <ExecutiveTrendComparisonBarChart
          title={`Cross-Site Performance Comparison: ${metricKey.replace(/_/g, ' ').toUpperCase()}`}
          subtitle={`Baseline: Prior Period · Comparison: ${period}`}
          comparisons={comparisons}
        />
      </section>

      {/* Detail Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[var(--psm-text)] border-b border-[var(--psm-line)] pb-3">
          Fair Comparison & Denominator Rationale
        </h3>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                <th className="py-2.5 px-3">Site / Facility</th>
                <th className="py-2.5 px-3">Prior Period</th>
                <th className="py-2.5 px-3">Current Period</th>
                <th className="py-2.5 px-3">Delta</th>
                <th className="py-2.5 px-3">Comparability</th>
                <th className="py-2.5 px-3">Normalization Methodology</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {comparisons.map((c) => (
                <tr key={c.targetId} className="hover:bg-[var(--psm-surface-2)]">
                  <td className="py-3 px-3 font-semibold text-[var(--psm-text)]">{c.targetName}</td>
                  <td className="py-3 px-3 font-mono text-[var(--psm-muted)]">{c.baselineValue}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[var(--psm-text)]">{c.comparisonValue}</td>
                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`font-semibold ${
                        c.delta > 0
                          ? 'text-emerald-500'
                          : c.delta < 0
                          ? 'text-rose-500'
                          : 'text-[var(--psm-muted)]'
                      }`}
                    >
                      {c.delta > 0 ? `+${c.delta}` : c.delta} ({c.deltaPercentage}%)
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <TrendComparabilityBadge comparability={c.comparabilityStatus} />
                  </td>
                  <td className="py-3 px-3 text-[var(--psm-muted)] max-w-xs">{c.denominatorRationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
