'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, ArrowLeftRight, Building2, CheckCircle2 } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { ExecutivePerformanceStatusBadge } from '../shared/ExecutivePerformanceStatusBadge';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePerformanceComparisonPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const query = useQuery({
    queryKey: ['executive', 'performance', 'compare'],
    queryFn: () => executiveApi.performanceCompare({ scopeType: 'site' }),
  });

  const comparison = query.data;
  const scopes: any[] = (comparison as any)?.scopes ?? (comparison as any)?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Facility Benchmarking
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Scope Performance Comparison</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Side-by-side PSM evaluation across operating facilities, units, and critical risk modules.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {query.isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError || !query.data ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load performance comparison data.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {scopes.map((scope: any) => {
            const score = scope.performance_score_foundation;
            return (
              <div
                key={scope.id ?? scope.scope_record_id}
                className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm transition hover:border-[var(--psm-primary)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--psm-surface-2)] text-[var(--psm-primary)]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[var(--psm-text)]">{scope.scope_label}</h3>
                      <p className="text-xs text-[var(--psm-muted)]">Type: {scope.scope_type ?? 'Site'}</p>
                    </div>
                  </div>
                  <ExecutivePerformanceStatusBadge status={scope.performance_status ?? 'Healthy'} />
                </div>

                <div className="mt-5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-center">
                  <span className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">
                    PSM Health Score
                  </span>
                  <div className="mt-1 text-3xl font-extrabold text-[var(--psm-text)]">
                    {score != null ? `${score}/100` : '—'}
                  </div>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
                    <span className="text-[var(--psm-muted)]">Critical Alerts</span>
                    <span className="font-bold text-[var(--psm-text)]">{scope.critical_alert_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
                    <span className="text-[var(--psm-muted)]">Overdue Actions</span>
                    <span className="font-bold text-[var(--psm-text)]">{scope.overdue_action_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--psm-line)] pb-2">
                    <span className="text-[var(--psm-muted)]">Pending Approvals</span>
                    <span className="font-bold text-[var(--psm-text)]">{scope.pending_approval_count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--psm-muted)]">Data Quality</span>
                    <span className="font-semibold text-[var(--psm-primary)]">{scope.data_quality_status ?? 'High'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
