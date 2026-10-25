'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveSitePerformanceTable } from './ExecutiveSitePerformanceTable';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutiveSitePerformanceRegisterPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const query = useQuery({
    queryKey: ['executive', 'performance', 'sites'],
    queryFn: () => executiveApi.performanceScopes('site'),
  });

  const sites = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Facility Overview
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Site Performance Directory</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Comprehensive multi-site PSM readiness, open risk hotspots, and compliance benchmarks.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      <ExecutiveSitePerformanceTable rows={sites} loading={query.isLoading} />
    </main>
  );
}
