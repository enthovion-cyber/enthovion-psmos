'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveRankingStatusBadge } from '../shared/ExecutiveRankingStatusBadge';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

export function ExecutivePerformanceRankingsPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const [rankingType, setRankingType] = useState('best-performing-sites');

  const query = useQuery({
    queryKey: ['executive', 'performance', 'rankings', rankingType],
    queryFn: () => executiveApi.performanceRankings({ scopeType: 'site', rankingType }),
  });

  const rankingTypes = [
    { id: 'best-performing-sites', label: 'Best Performing Sites' },
    { id: 'worst-performing-sites', label: 'Worst Performing Sites' },
    { id: 'highest-critical-alerts', label: 'Highest Critical Alerts' },
    { id: 'most-overdue-actions', label: 'Most Overdue Actions' },
    { id: 'most-stale-records', label: 'Most Stale Records' },
    { id: 'best-training-compliance', label: 'Best Training Compliance' },
  ];

  const rankings = query.data?.rankings ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">
            Executive KPI · Benchmarking
          </p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Performance Rankings</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Backend-calculated deterministic leaderboards and gap rankings across assigned facilities.
          </p>
        </div>
        <ExecutiveThemeToggle />
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--psm-line)] pb-4">
        {rankingTypes.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRankingType(tab.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              rankingType === tab.id
                ? 'bg-[var(--psm-primary)] text-white shadow'
                : 'border border-[var(--psm-line)] bg-[var(--psm-surface)] text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />
      ) : query.isError || !query.data ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-[var(--psm-text)]">
          Could not load rankings data. Verify your executive permissions.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Rank</th>
                  <th className="px-4 py-3">Facility / Scope</th>
                  <th className="px-4 py-3">Metric Value</th>
                  <th className="px-4 py-3">Health Status</th>
                  <th className="px-4 py-3">Ranking Method / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {rankings.map((rank: any) => {
                  const isTop = rank.rank_position === 1;
                  const isTop3 = rank.rank_position <= 3;
                  return (
                    <tr
                      key={rank.id ?? rank.rank_position}
                      className={`hover:bg-[var(--psm-surface-2)] ${
                        isTop ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                            isTop
                              ? 'bg-amber-500 text-white shadow'
                              : isTop3
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'
                          }`}
                        >
                          {rank.rank_position}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--psm-text)]">{rank.scope_label}</div>
                        <div className="text-xs text-[var(--psm-muted)]">ID: {rank.scope_record_id}</div>
                      </td>
                      <td className="px-4 py-3 font-black text-lg text-[var(--psm-text)]">
                        {rank.ranking_value != null ? rank.ranking_value : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ExecutiveRankingStatusBadge status={rank.ranking_status ?? 'Standard'} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--psm-muted)]">
                        {rank.ranking_reason ?? 'Ranked by latest permitted aggregation score.'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!rankings.length ? (
            <div className="py-12 text-center text-sm text-[var(--psm-muted)]">
              No ranking records available for the selected metric.
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
