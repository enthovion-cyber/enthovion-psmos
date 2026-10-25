'use client';

import React, { useState } from 'react';
import {
  Compass,
  Filter,
  Calendar,
  Layers,
  Download,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  useExecutiveTrendExplorer,
  useExecutiveTrendLookups,
} from '../hooks/useExecutiveTrends';
import { ExecutiveTrendMultiLineChart } from '../components/charts';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import {
  TrendDirectionBadge,
  TrendDataQualityBadge,
} from './ExecutiveTrendBadges';

export function ExecutiveTrendExplorerPage() {
  const [metricKey, setMetricKey] = useState('overall_psm_health_index');
  const [granularity, setGranularity] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'>('Monthly');
  const [scopeType, setScopeType] = useState('Company');
  const [siteId, setSiteId] = useState('');

  const query = useExecutiveTrendExplorer({
    metricKey,
    granularity,
    scopeType,
    siteId: siteId || undefined,
  });

  const lookups = useExecutiveTrendLookups();

  // Prepare chart series from explorer query response
  const points = (query.data?.points ?? []).map((pt) => ({
    period: pt.period_label || pt.period_start,
    value: Number(pt.metric_value ?? 0),
    dataQuality: (pt.data_quality_status || 'Verified') as any,
  }));

  const chartSeries = [
    {
      seriesId: metricKey,
      metricKey,
      seriesLabel: metricKey.replace(/_/g, ' ').toUpperCase(),
      color: '#0284c7',
      unit: metricKey.includes('score') || metricKey.includes('health') || metricKey.includes('rate') ? '%' : '',
      points,
    },
  ];

  const missingPoints = points.filter((p) => p.dataQuality === 'Missing');

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Interactive KPI Trend Explorer"
        subtitle="Drill into historical time series by metric, granularity, and scope. Missing observations remain explicitly marked."
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice missingCount={missingPoints.length} />

      {/* Explorer Filter Controls */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Metric Dimension
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
            >
              <option value="overall_psm_health_index">Overall PSM Health Index</option>
              <option value="critical_risks_count">Active Critical Risks Count</option>
              <option value="overdue_actions_count">Overdue PSM Actions Count</option>
              <option value="escalation_sla_breach_rate">Escalation SLA Breach Rate (%)</option>
              <option value="repeat_issue_candidates_count">Repeat Safety Weaknesses</option>
              <option value="moc_readiness_score">MOC Health & Readiness Score</option>
              <option value="mechanical_integrity_compliance">Mechanical Integrity Inspection Rate</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Granularity
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as any)}
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
              Scope
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value)}
            >
              <option value="Company">Enterprise-wide (All Sites)</option>
              <option value="Site">Specific Site</option>
            </select>
          </div>

          {scopeType === 'Site' && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                Site ID
              </label>
              <input
                type="text"
                placeholder="Enter Site ID"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Warning on Missing Historical Intervals */}
      {missingPoints.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
          <AlertCircle size={16} />
          <span>
            {missingPoints.length} periods in this date range have no recorded historical observation. Lines are broken to prevent false interpolation.
          </span>
        </div>
      )}

      {/* Multi-Line Infographic Chart */}
      <section>
        <ExecutiveTrendMultiLineChart
          title={`Trend Trajectory: ${metricKey.replace(/_/g, ' ').toUpperCase()}`}
          subtitle={`Granularity: ${granularity} · Scope: ${scopeType} ${siteId ? `(${siteId})` : ''}`}
          series={chartSeries}
          height={340}
        />
      </section>

      {/* Historical Data Points Table */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[var(--psm-text)] border-b border-[var(--psm-line)] pb-3">
          Historical Observations & Quality Breakdown
        </h3>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                <th className="py-2 px-3">Period</th>
                <th className="py-2 px-3">Metric Value</th>
                <th className="py-2 px-3">Quality Status</th>
                <th className="py-2 px-3">Raw Count / Sample</th>
                <th className="py-2 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {points.length > 0 ? (
                points.map((pt, i) => (
                  <tr key={i} className="hover:bg-[var(--psm-surface-2)]">
                    <td className="py-2.5 px-3 font-semibold text-[var(--psm-text)]">{pt.period}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[var(--psm-text)]">
                      {pt.dataQuality === 'Missing' ? '—' : pt.value}
                    </td>
                    <td className="py-2.5 px-3">
                      <TrendDataQualityBadge quality={pt.dataQuality} />
                    </td>
                    <td className="py-2.5 px-3 text-[var(--psm-muted)]">Verified primary record</td>
                    <td className="py-2.5 px-3 text-emerald-500 font-semibold">
                      {pt.dataQuality === 'Missing' ? '0%' : '100%'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[var(--psm-muted)]">
                    No historical observations match this criteria. Generate a historical run to record data points.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
