'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  History,
  Play,
  RotateCcw,
  Archive,
  Ban,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Search,
} from 'lucide-react';
import {
  useExecutiveTrendRuns,
  useExecutiveTrendMutations,
} from '../hooks/useExecutiveTrends';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import { TrendRunStatusBadge } from './ExecutiveTrendBadges';
import { CreateTrendRunDialog } from './ExecutiveTrendDialogs';

export function ExecutiveTrendRunsPage() {
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const query = useExecutiveTrendRuns({
    sourceCategory: filterSource !== 'all' ? filterSource : undefined,
    runStatus: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const mutations = useExecutiveTrendMutations();
  const runs = query.data?.rows ?? [];

  const filteredRuns = runs.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (r.run_title && r.run_title.toLowerCase().includes(term)) ||
      (r.run_code && r.run_code.toLowerCase().includes(term)) ||
      (r.source_category && r.source_category.toLowerCase().includes(term))
    );
  });

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title="Immutable Trend Runs Register"
        subtitle="Auditable record of historical metric computations. Prior runs remain frozen for regulatory reproducibility."
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
          >
            <Play size={14} />
            <span>New Trend Run</span>
          </button>
        }
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-[var(--psm-muted)]" size={14} />
            <input
              type="text"
              placeholder="Search by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] pl-8 pr-3 py-1.5 text-xs text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1.5 text-xs text-[var(--psm-text)] focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="psm-health">PSM Health</option>
            <option value="module-health">Module Health</option>
            <option value="kpis">KPIs</option>
            <option value="critical-risks">Critical Risks</option>
            <option value="overdue-actions">Overdue Actions</option>
            <option value="escalations">Escalations</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1.5 text-xs text-[var(--psm-text)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Running">Running</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Stale">Stale</option>
          </select>
        </div>

        <span className="text-xs text-[var(--psm-muted)]">
          Showing <strong className="text-[var(--psm-text)]">{filteredRuns.length}</strong> immutable run(s)
        </span>
      </div>

      {/* Table of Runs */}
      <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                <th className="py-2.5 px-3">Run Code</th>
                <th className="py-2.5 px-3">Title / Scope</th>
                <th className="py-2.5 px-3">Source & Granularity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Quality Score</th>
                <th className="py-2.5 px-3">Completed At</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {filteredRuns.length > 0 ? (
                filteredRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--psm-surface-2)] transition">
                    <td className="py-3 px-3 font-mono font-bold text-[var(--psm-primary)]">
                      <Link href={`/executive/trends/runs/${r.id}`} className="hover:underline">
                        {r.run_code}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-[var(--psm-text)]">{r.run_title || 'Untitled Run'}</p>
                      <p className="text-[11px] text-[var(--psm-muted)]">
                        {r.scope_type} {r.site_id ? `· Site ${r.site_id}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-[var(--psm-muted)]">
                      {r.source_category} · <span className="font-medium text-[var(--psm-text)]">{r.granularity}</span>
                    </td>
                    <td className="py-3 px-3">
                      <TrendRunStatusBadge status={r.run_status} />
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-emerald-500">
                        {r.data_quality_score ?? 100}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--psm-muted)]">
                      {r.completed_at ? new Date(r.completed_at).toLocaleString() : 'In Progress'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/executive/trends/runs/${r.id}`}
                          className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] px-2 py-1 text-[11px] font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
                        >
                          Trace
                        </Link>
                        <button
                          onClick={() => mutations.recalculate.mutate(r.id)}
                          disabled={mutations.recalculate.isPending}
                          title="Generate new calculation run based on current source data"
                          className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1 text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[var(--psm-muted)]">
                    No trend runs match the active filter criteria. Click "New Trend Run" to execute a computation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CreateTrendRunDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </main>
  );
}
