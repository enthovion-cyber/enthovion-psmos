'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useManagementReviewCarryForward,
  useManagementReviewRegister,
} from '../hooks/useExecutiveManagementReview';
import {
  ManagementReviewHeader,
  ManagementReviewNav,
  ManagementReviewEmptyState,
  cardStyle,
  buttonStyle,
  inputStyle,
} from './ExecutiveManagementReviewShared';
import {
  CommitmentStatusBadge,
} from './ManagementReviewBadges';

export function ExecutiveManagementReviewCarryForwardPage() {
  const [cycleFilter, setCycleFilter] = useState('');
  const [search, setSearch] = useState('');

  const carryForwardQuery = useManagementReviewCarryForward(
    cycleFilter ? { cycleId: cycleFilter } : undefined
  );
  const cyclesQuery = useManagementReviewRegister('cycles');

  const raw = carryForwardQuery.data as any;
  const items: any[] = Array.isArray(raw) ? raw : (raw?.rows ?? []);
  const cyclesList = Array.isArray(cyclesQuery.data)
    ? cyclesQuery.data
    : (cyclesQuery.data as any)?.rows ?? [];

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      item.commitment_title?.toLowerCase().includes(term) ||
      item.commitment_code?.toLowerCase().includes(term) ||
      item.carry_forward_reason?.toLowerCase().includes(term) ||
      item.notes?.toLowerCase().includes(term)
    );
  });

  // Calculate summary metrics
  const totalCount = items.length;
  const reasonCounts = items.reduce<Record<string, number>>((acc, it) => {
    const r = it.carry_forward_reason || 'Unspecified';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="space-y-6">
      <ManagementReviewNav activeTab="carried-forward" />

      <ManagementReviewHeader
        title="Carried-Forward Commitments"
        description="Audit trace of management review commitments carried forward across governance cycles with documented justification."
      />

      {/* Infographic Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardStyle}>
          <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Total Carried Items</p>
          <p className="mt-2 text-3xl font-black text-[var(--psm-text)]">{totalCount}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Across all governance cycles</p>
        </div>

        <div className={cardStyle}>
          <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Active In Progress</p>
          <p className="mt-2 text-3xl font-black text-amber-500">
            {items.filter((i) => i.status === 'in_progress' || !i.status).length}
          </p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Pending resolution in current cycle</p>
        </div>

        <div className={cardStyle}>
          <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Top Reason</p>
          <p className="mt-2 text-xl font-bold truncate text-[var(--psm-primary)]">
            {Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
          </p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            {Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} occurrences
          </p>
        </div>

        <div className={cardStyle}>
          <p className="text-xs uppercase tracking-wider text-[var(--psm-muted)]">Governance Control</p>
          <p className="mt-2 text-lg font-bold text-emerald-500">Mandatory Approval</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Carry-forward requires executive authorization</p>
        </div>
      </section>

      {/* Filters */}
      <div className={`${cardStyle} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search carried forward items..."
            className={`${inputStyle} w-64`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={inputStyle}
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
          >
            <option value="">All Cycles</option>
            {cyclesList.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.cycle_title || c.title || c.code}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-[var(--psm-muted)]">
          Showing {filtered.length} of {totalCount} records
        </span>
      </div>

      {/* Table */}
      <div className={`${cardStyle} overflow-x-auto`}>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="pb-3 font-semibold">Commitment</th>
              <th className="pb-3 font-semibold">Origin Cycle</th>
              <th className="pb-3 font-semibold">Target Cycle</th>
              <th className="pb-3 font-semibold">Reason</th>
              <th className="pb-3 font-semibold">Carried Date</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {filtered.map((item: any) => (
              <tr key={item.id} className="hover:bg-[var(--psm-surface-2)]/40 transition-colors">
                <td className="py-3 pr-4">
                  <p className="font-semibold text-[var(--psm-text)]">
                    {item.commitment_title || item.title || `Item #${item.id?.slice(0, 8)}`}
                  </p>
                  {item.commitment_code && (
                    <p className="font-mono text-xs text-[var(--psm-muted)]">{item.commitment_code}</p>
                  )}
                </td>

                <td className="py-3 pr-4 text-xs">
                  <span className="font-medium text-[var(--psm-text)]">
                    {item.origin_cycle_title || item.origin_cycle_id?.slice(0, 8) || 'Previous Cycle'}
                  </span>
                </td>

                <td className="py-3 pr-4 text-xs">
                  <span className="font-medium text-[var(--psm-primary)]">
                    {item.target_cycle_title || item.target_cycle_id?.slice(0, 8) || 'Target Cycle'}
                  </span>
                </td>

                <td className="py-3 pr-4">
                  <span className="inline-block rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--psm-text)]">
                    {item.carry_forward_reason || 'Unspecified'}
                  </span>
                  {item.notes && (
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--psm-muted)]">{item.notes}</p>
                  )}
                </td>

                <td className="py-3 pr-4 text-xs text-[var(--psm-muted)]">
                  {item.carried_forward_at
                    ? new Date(item.carried_forward_at).toLocaleDateString()
                    : item.created_at
                    ? new Date(item.created_at).toLocaleDateString()
                    : '—'}
                </td>

                <td className="py-3 pr-4">
                  <CommitmentStatusBadge status={item.status || 'open'} />
                </td>

                <td className="py-3 text-right">
                  <Link
                    href={`/executive/management-review/commitments`}
                    className={`${buttonStyle} text-xs`}
                  >
                    View Commitments
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && !carryForwardQuery.isLoading && (
          <ManagementReviewEmptyState
            title="No carried-forward commitments found"
            message="No commitments have been deferred to a subsequent review cycle for the selected scope."
          />
        )}
      </div>
    </main>
  );
}
