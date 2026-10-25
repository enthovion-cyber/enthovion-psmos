'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, MapPin, Layers, Activity, BarChart3, ChevronRight, ShieldCheck, Database } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutivePerformanceSummaryCards } from './ExecutivePerformanceSummaryCards';
import { ExecutiveSitePerformanceTable } from './ExecutiveSitePerformanceTable';
import { ExecutiveTrendAreaChart, ExecutiveHealthRadarInfographic } from '../components/charts';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePerformanceDashboardPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const canRecalculate = granted.has('executive.performance.recalculate');
  const client = useQueryClient();

  const query = useQuery({
    queryKey: ['executive', 'performance', 'dashboard'],
    queryFn: () => executiveApi.performanceDashboard(),
  });

  const recalc = useMutation({
    mutationFn: () => executiveApi.performanceRecalculate(),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['executive', 'performance'] }),
  });

  if (query.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />;
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
        Performance dashboard could not be loaded. Please ensure permissions are granted.
      </div>
    );
  }

  const { company, sites } = query.data;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-col gap-4 border-b border-[var(--psm-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Phase 3
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[var(--psm-text)]">Scope Performance Cockpit</h1>
            <span className="rounded-full bg-[var(--psm-primary)]/15 px-2.5 py-0.5 text-xs font-bold text-[var(--psm-primary)]">
              Enterprise Aggregation
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-[var(--psm-muted)]">
            Company, site, unit, and equipment operational intelligence calculated strictly from authorized aggregation runs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExecutiveThemeToggle />
          {canRecalculate ? (
            <button
              type="button"
              onClick={() => recalc.mutate()}
              disabled={recalc.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${recalc.isPending ? 'animate-spin' : ''}`} />
              {recalc.isPending ? 'Recalculating…' : 'Recalculate Performance'}
            </button>
          ) : null}
        </div>
      </header>

      {/* Historical Performance Area Trend Infographic */}
      <ExecutiveTrendAreaChart
        currentScore={company.performance_score_foundation}
        currentActions={company.overdue_action_count}
        currentIncidents={company.critical_alert_count}
      />

      {/* Primary KPI Summary Cards */}
      <ExecutivePerformanceSummaryCards scope={company} />

      {/* Quick Launch Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/executive/performance/sites"
          className="group rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h3 className="font-bold text-sm text-[var(--psm-text)]">Sites Benchmark</h3>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--psm-muted)] transition group-hover:translate-x-0.5" />
          </div>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">
            {sites.length} facilities monitored under active tenant policy.
          </p>
        </Link>

        <Link
          href="/executive/performance/heatmap"
          className="group rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-sm text-[var(--psm-text)]">Module Heatmap</h3>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--psm-muted)] transition group-hover:translate-x-0.5" />
          </div>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">
            Multi-module compliance and risk density matrix.
          </p>
        </Link>

        <Link
          href="/executive/performance/rankings"
          className="group rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-sm text-[var(--psm-text)]">Rankings Leaderboard</h3>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--psm-muted)] transition group-hover:translate-x-0.5" />
          </div>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">
            Best vs worst performer leaderboards and action backlog.
          </p>
        </Link>

        <Link
          href="/executive/performance/drilldown"
          className="group rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition hover:border-[var(--psm-primary)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              <h3 className="font-bold text-sm text-[var(--psm-text)]">Hierarchy Drilldown</h3>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--psm-muted)] transition group-hover:translate-x-0.5" />
          </div>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">
            Interactive Company → Site → Unit → Equipment explorer.
          </p>
        </Link>
      </section>

      {/* Sites Performance Benchmark Table */}
      <ExecutiveSitePerformanceTable rows={sites} />
    </main>
  );
}
