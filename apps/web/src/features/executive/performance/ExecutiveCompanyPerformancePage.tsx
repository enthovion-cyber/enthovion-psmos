'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveStatusBadge } from '../components/shared/ExecutiveStatusBadge';
import { ExecutiveTrendAreaChart, ExecutiveCrossModuleChart, ExecutiveSiteBenchmarkChart } from '../components/charts';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { Building2, ShieldAlert, Clock, AlertTriangle, Layers, Database } from 'lucide-react';

const card = 'rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm';

export function ExecutiveCompanyPerformancePage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const companyQuery = useQuery({ queryKey: ['executive', 'performance', 'company'], queryFn: () => executiveApi.performanceCompany() });
  const sitesQuery = useQuery({ queryKey: ['executive', 'phase2-sites'], queryFn: () => executiveApi.phase2Sites() });
  const modulesQuery = useQuery({ queryKey: ['executive', 'phase2-modules'], queryFn: () => executiveApi.phase2Modules() });

  if (companyQuery.isLoading) return <div className="h-72 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />;
  if (companyQuery.isError || !companyQuery.data) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-[var(--psm-text)]">
        <h2 className="font-bold text-base text-rose-700 dark:text-rose-300">Company Performance Unavailable</h2>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Confirm the Executive Phase 3 migration has been applied and your user role has company-level performance access.</p>
      </div>
    );
  }

  const company = companyQuery.data;
  const sites = sitesQuery.data ?? [];
  const modules = modulesQuery.data ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
          Executive KPI · Phase 3 Enterprise Cockpit
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Company Performance Overview</h1>
          <ExecutiveStatusBadge status={company.performance_status} />
        </div>
        <p className="text-sm text-[var(--psm-muted)]">
          Comprehensive enterprise-level aggregation synthesized from connected operating sites, business units, and 14 operational module adapters.
        </p>
      </header>

      {/* 1. Overview Stat Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className={card}>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">Overall PSM Health</span>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">
            {company.performance_score_foundation ?? '—'} <span className="text-xs font-normal text-[var(--psm-muted)]">/ 100</span>
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Enterprise Foundation Score</p>
        </div>

        <div className={card}>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">Sites Monitored</span>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">{sites.length}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Operating Plant Facilities</p>
        </div>

        <div className={card}>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">Critical Open Items</span>
          <p className="mt-2 text-3xl font-extrabold text-rose-500">{company.critical_alert_count}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Ranked Process Safety Risks</p>
        </div>

        <div className={card}>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">Overdue Actions</span>
          <p className="mt-2 text-3xl font-extrabold text-amber-500">{company.overdue_action_count}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Past SLA Across Modules</p>
        </div>

        <div className={card}>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">Data Quality</span>
          <p className="mt-2 text-2xl font-bold text-[var(--psm-text)]">{company.data_quality_status}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Aggregation Verified</p>
        </div>
      </section>

      {/* 2. Enterprise Trajectory Trend */}
      <ExecutiveTrendAreaChart currentScore={company.performance_score_foundation} />

      {/* 3. Multi-Site Benchmark Visual Cards */}
      <ExecutiveSiteBenchmarkChart sites={sites} />

      {/* 4. Cross-Module Scoring Distribution Bar Chart */}
      <ExecutiveCrossModuleChart modules={modules} />

      {/* 5. Navigation Links to Deeper Performance Slices */}
      <section className="grid gap-4 lg:grid-cols-4">
        <Link href="/executive/performance/sites" className={`${card} transition hover:border-[var(--psm-primary)]`}>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[var(--psm-primary)]" />
            <h2 className="font-semibold text-[var(--psm-text)]">Site Comparison Matrix</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Filter and benchmark across all authorized plant sites.</p>
        </Link>

        <Link href="/executive/performance/units" className={`${card} transition hover:border-[var(--psm-primary)]`}>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-blue-500" />
            <h2 className="font-semibold text-[var(--psm-text)]">Unit Performance</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Drill down into process units and battery limits.</p>
        </Link>

        <Link href="/executive/performance/heatmap" className={`${card} transition hover:border-[var(--psm-primary)]`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-semibold text-[var(--psm-text)]">Module Heatmap</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Status density matrix of sites vs PSM modules.</p>
        </Link>

        <Link href="/executive/performance/drilldown" className={`${card} transition hover:border-[var(--psm-primary)]`}>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-emerald-500" />
            <h2 className="font-semibold text-[var(--psm-text)]">Scope Drilldown Explorer</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Step through Company &rarr; Site &rarr; Unit &rarr; Module.</p>
        </Link>
      </section>
    </main>
  );
}
