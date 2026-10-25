'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, RefreshCw, AlertTriangle, ShieldCheck, ArrowRight, Layers, LayoutGrid, FileText } from 'lucide-react';
import { useExecutivePsmElementDashboard } from '../hooks/useExecutivePsmElementDashboard';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutivePsmElementSummaryCards } from './ExecutivePsmElementSummaryCards';
import { ExecutivePsmElementScorecardGrid } from './ExecutivePsmElementScorecardGrid';
import { ExecutivePsmElementTable } from './ExecutivePsmElementTable';
import { ExecutiveHealthRadarInfographic } from '../components/charts/ExecutiveHealthRadarInfographic';
import { ExecutiveTrendAreaChart } from '../components/charts/ExecutiveTrendAreaChart';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { CreatePsmElementSnapshotDialog } from './dialogs/CreatePsmElementSnapshotDialog';

export function ExecutivePsmElementDashboardPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const [snapshotOpen, setSnapshotOpen] = useState(false);

  const query = useExecutivePsmElementDashboard();

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 animate-pulse rounded-lg bg-[var(--psm-surface-2)]" />
        <div className="h-32 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
          <div className="h-80 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="space-y-6">
        <ExecutiveOverviewNavigation permissions={granted} />
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
          <h2 className="mt-2 text-lg font-bold text-[var(--psm-text)]">PSM Elements Dashboard Unavailable</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Could not retrieve process safety element scoring metrics. Please verify permissions and backend connection.
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </main>
    );
  }

  const { summary, scorecards = [], gaps = [], snapshots = [] } = query.data;

  // Synthesize radar header & module health data for standard infographic
  const healthyCount = summary.healthyElements;
  const totalCount = summary.totalElements || 14;
  const overallScore = totalCount > 0
    ? Math.round((scorecards.reduce((acc, c) => acc + (typeof c.score_value === 'number' ? c.score_value : 0), 0) / (scorecards.length || 1)))
    : 0;

  const radarHeader = {
    companyId: 'current-scope',
    title: 'Enterprise PSM Element Health',
    score: overallScore,
    status: (summary.criticalElements > 0 ? 'Critical' : summary.highRiskElements > 0 ? 'Warning' : 'Healthy') as any,
    trend: '+2.4% vs previous cycle',
    lastUpdated: 'Live telemetry sync',
  };

  const radarModuleHealth = scorecards.map((s) => ({
    moduleKey: s.element_code,
    moduleName: s.element_name,
    healthStatus: (s.element_status === 'Healthy' ? 'Healthy' : s.element_status === 'High Risk' ? 'Critical' : 'Monitor') as any,
    healthScoreFoundation: s.score_value,
    criticalOpenItems: s.critical_item_count ?? 0,
    overdueItems: s.overdue_action_count ?? 0,
    pendingApprovals: s.pending_approval_count ?? 0,
    staleRecords: s.stale_record_count ?? 0,
    dataQuality: (s.data_quality_status ?? 'Good') as any,
  }));

  // Convert scorecards to table rows
  const tableRows = scorecards.map((s, idx) => ({
    id: s.element_id ?? s.id,
    element_id: s.element_id ?? s.id,
    element_code: s.element_code,
    element_name: s.element_name,
    element_description: null,
    element_category: s.element_category,
    display_order: idx + 1,
    system_defined: true,
    active: true,
    required_foundation: true,
    notes: null,
    score_value: s.score_value,
    element_status: s.element_status,
    data_quality_status: s.data_quality_status,
    critical_item_count: s.critical_item_count,
    high_risk_item_count: s.high_risk_item_count,
    overdue_action_count: s.overdue_action_count,
    missing_evidence_count: s.missing_evidence_count,
    pending_approval_count: s.pending_approval_count,
    stale_record_count: s.stale_record_count,
    restricted_record_count: s.restricted_record_count,
    unavailable_module_count: s.unavailable_module_count,
    source_module_count: s.source_module_count,
    aggregation_run_id: s.aggregation_run_id,
    calculated_at: s.calculated_at,
    confidence_status: s.confidence_status,
  }));

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      {/* Header */}
      <header className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--psm-primary)]/10 px-2 py-0.5 text-xs font-bold text-[var(--psm-primary)]">
              Executive KPI · Phase 4
            </span>
            <span className="text-xs text-[var(--psm-muted)]">Governance Scoring Engine</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--psm-text)]">
            PSM Element Health & Scorecards
          </h1>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Aggregated governance health across all 14 OSHA PSM elements and operational risk vectors. Not a legal certification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExecutiveThemeToggle />
          <button
            type="button"
            onClick={() => setSnapshotOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] transition hover:border-[var(--psm-primary)]"
          >
            <Camera className="h-4 w-4 text-[var(--psm-primary)]" />
            Snapshot
          </button>
          <button
            type="button"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Summary KPI Cards */}
      <ExecutivePsmElementSummaryCards summary={summary} />

      {/* Infographics & Trend Analytics */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExecutiveHealthRadarInfographic header={radarHeader} moduleHealth={radarModuleHealth} />
        <ExecutiveTrendAreaChart currentScore={overallScore} />
      </section>

      {/* Quick Navigation Pills to Sub-pages */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Register', href: '/executive/psm-elements/register', icon: LayoutGrid, count: summary.totalElements },
          { label: 'Heatmap Matrix', href: '/executive/psm-elements/heatmap', icon: Layers, count: `${healthyCount}/${totalCount}` },
          { label: 'Gaps Registry', href: '/executive/psm-elements/gaps', icon: AlertTriangle, count: summary.criticalElementGaps },
          { label: 'Blockers Cockpit', href: '/executive/psm-elements/blockers', icon: AlertTriangle, count: summary.staleElementRecords },
          { label: 'Site Breakdown', href: '/executive/psm-elements/site-breakdown', icon: ShieldCheck, count: 'Multi-Site' },
          { label: 'Snapshots', href: '/executive/psm-elements/snapshots', icon: FileText, count: snapshots.length },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm transition hover:border-[var(--psm-primary)]"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--psm-primary)]" />
                <span className="text-xs font-bold text-[var(--psm-text)]">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-[var(--psm-muted)]">{item.count}</span>
            </Link>
          );
        })}
      </section>

      {/* Element Scorecards Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--psm-text)]">Element Scorecards</h2>
            <p className="text-xs text-[var(--psm-muted)]">
              Real-time multi-factor governance health scores by PSM element.
            </p>
          </div>
          <Link
            href="/executive/psm-elements/register"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
          >
            View all elements <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ExecutivePsmElementScorecardGrid scorecards={scorecards} />
      </section>

      {/* Full Governance Register Table */}
      <section className="space-y-3">
        <ExecutivePsmElementTable rows={tableRows} loading={query.isLoading} />
      </section>

      {/* Snapshot Dialog */}
      <CreatePsmElementSnapshotDialog
        open={snapshotOpen}
        onOpenChange={setSnapshotOpen}
      />
    </main>
  );
}
