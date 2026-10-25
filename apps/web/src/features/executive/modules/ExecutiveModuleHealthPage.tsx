'use client';

import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { ExecutiveModuleHealthGrid } from '../components/ExecutiveModuleHealthGrid';
import { ExecutiveCrossModuleChart } from '../components/charts';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutiveModuleHealthPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useQuery({ queryKey: ['executive','phase2-modules'], queryFn: executiveApi.phase2Modules });

  if (query.isLoading) return <div className="h-64 animate-pulse rounded-lg bg-[var(--psm-surface-2)]" />;
  if (query.isError) return <div className="rounded-lg border border-rose-500/30 p-5 text-[var(--psm-text)]">Module health could not be loaded.</div>;

  const modules = query.data ?? [];

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Executive KPI Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--psm-text)]">Cross-Module Health Scoring &amp; Distribution</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Persisted, permission-aware cross-module health from the latest aggregation run across 14 plant adapters.</p>
      </header>

      {/* 1. Interactive 14-Module Health Scoring Distribution Bar Chart */}
      <ExecutiveCrossModuleChart modules={modules} />

      {/* 2. Detailed Module Grid Cards */}
      <ExecutiveModuleHealthGrid modules={modules} />
    </main>
  );
}
