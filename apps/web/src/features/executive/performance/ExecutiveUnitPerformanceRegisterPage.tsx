'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveUnitPerformanceTable } from './ExecutiveUnitPerformanceTable';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutiveUnitPerformanceRegisterPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const query = useQuery({
    queryKey: ['executive', 'performance', 'units'],
    queryFn: () => executiveApi.performanceScopes('unit'),
  });

  const units = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Unit Registry
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Unit Performance Directory</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Comprehensive process units readiness, open risk hotspots, and compliance benchmarks.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      <ExecutiveUnitPerformanceTable rows={units} loading={query.isLoading} />
    </main>
  );
}
