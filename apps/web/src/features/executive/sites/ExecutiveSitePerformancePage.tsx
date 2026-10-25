'use client';
import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import { ExecutiveSitePerformanceTable } from '../components/ExecutiveSitePerformanceTable';
import { ExecutiveSiteBenchmarkChart } from '../components/charts';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutiveSitePerformancePage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useQuery({ queryKey: ['executive','phase2-sites'], queryFn: executiveApi.phase2Sites });

  if (query.isLoading) return <div className="h-64 animate-pulse rounded-lg bg-[var(--psm-surface-2)]" />;
  if (query.isError) return <div className="rounded-lg border border-rose-500/30 p-5 text-[var(--psm-text)]">Site performance could not be loaded.</div>;

  const sites = query.data ?? [];

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Phase 2 Site Intelligence</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--psm-text)]">Site Performance &amp; Benchmarking</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Permitted comparison from persisted Phase 2 aggregation results. Restricted sites are not exposed.</p>
      </header>
      <ExecutiveSiteBenchmarkChart sites={sites} />
      <ExecutiveSitePerformanceTable sites={sites} />
    </main>
  );
}
