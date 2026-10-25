'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, RefreshCw, LayoutGrid, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useExecutivePsmElements } from '../hooks/useExecutivePsmElements';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { ExecutivePsmElementTable } from './ExecutivePsmElementTable';
import type { PsmElementRow } from '../types/executive-psm-element.types';

export function ExecutivePsmElementRegisterPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const query = useExecutivePsmElements();

  const allRows: PsmElementRow[] = query.data?.rows ?? [];

  const filteredRows = allRows.filter((row) => {
    const matchesSearch =
      search.trim() === '' ||
      `${row.element_code} ${row.element_name} ${row.element_category}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || row.element_category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || row.element_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(allRows.map((r) => r.element_category).filter(Boolean)));

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      {/* Header */}
      <header className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/executive/psm-elements/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--psm-text)]">
            PSM Element Registry
          </h1>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Canonical 14 OSHA PSM elements and custom process safety domains with live governance status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExecutiveThemeToggle />
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

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--psm-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by element code, name, or category..."
            className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] pl-9 pr-4 py-2 text-xs text-[var(--psm-text)] placeholder:text-[var(--psm-muted)] focus:border-[var(--psm-primary)] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs font-medium text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs font-medium text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Healthy">Healthy</option>
            <option value="Monitor">Monitor</option>
            <option value="Attention Required">Attention Required</option>
            <option value="High Risk">High Risk</option>
            <option value="Critical">Critical</option>
            <option value="Insufficient Data">Insufficient Data</option>
          </select>

          <span className="text-xs font-semibold text-[var(--psm-muted)]">
            Showing {filteredRows.length} of {allRows.length}
          </span>
        </div>
      </div>

      {/* Elements Table */}
      <ExecutivePsmElementTable rows={filteredRows} loading={query.isLoading} />
    </main>
  );
}
