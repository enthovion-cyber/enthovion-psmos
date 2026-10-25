'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Lock,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  useExecutiveReportPeriods,
  useExecutiveReportMutations,
} from '../hooks/useExecutiveReports';
import {
  ExecutiveReportsNav,
  ExecutiveReportsHeader,
  ExecutiveReportIntegrityNotice,
} from './ExecutiveReportsShared';
import type { ExecutiveReportingPeriod } from '../types/executive-report.types';

export function ExecutiveReportingPeriodsPage() {
  const periodsQuery = useExecutiveReportPeriods();
  const mutations = useExecutiveReportMutations();

  const periods = (periodsQuery.data?.rows ?? []) as ExecutiveReportingPeriod[];

  const [createOpen, setCreateOpen] = useState(false);
  const [periodName, setPeriodName] = useState('');
  const [periodCode, setPeriodCode] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [cutOffDate, setCutOffDate] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodName.trim() || !periodCode.trim() || !startsAt || !endsAt || !cutOffDate) return;
    await mutations.savePeriod.mutateAsync({
      name: periodName.trim(),
      code: periodCode.trim(),
      startsAt,
      endsAt,
      cutOffDate,
    });
    setCreateOpen(false);
    setPeriodName('');
    setPeriodCode('');
    setStartsAt('');
    setEndsAt('');
    setCutOffDate('');
    periodsQuery.refetch();
  };

  return (
    <main className="space-y-6">
      <ExecutiveReportsNav />

      <ExecutiveReportsHeader
        title="Reporting Periods & Snapshot Cut-offs"
        subtitle="Manage financial, operational, and audit cycles with immutable cut-off timestamps."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--psm-primary-hover)] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Period</span>
          </button>
        }
      />

      <ExecutiveReportIntegrityNotice readinessRate={100} missingSourcesCount={0} />

      {createOpen && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h2 className="text-sm font-bold text-[var(--psm-text)]">
              Create New Reporting Period
            </h2>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="text-xs text-[var(--psm-muted)] hover:text-[var(--psm-text)]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Period Name
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 2026 Process Safety Audit Cycle"
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Period Code
              </label>
              <input
                type="text"
                placeholder="e.g. ERP-2026-Q4"
                value={periodCode}
                onChange={(e) => setPeriodCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Starts At
              </label>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Ends At
              </label>
              <input
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-[var(--psm-muted)] uppercase tracking-wider text-[11px]">
                Cut-off Date
              </label>
              <input
                type="date"
                value={cutOffDate}
                onChange={(e) => setCutOffDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2 text-xs text-[var(--psm-text)] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-md border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.savePeriod.isPending}
              className="rounded-md bg-[var(--psm-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {mutations.savePeriod.isPending ? 'Saving...' : 'Save Period'}
            </button>
          </div>
        </form>
      )}

      {periodsQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
          <div className="flex items-center gap-3 text-sm text-[var(--psm-muted)]">
            <RefreshCw className="h-5 w-5 animate-spin text-[var(--psm-primary)]" />
            <span>Loading reporting periods...</span>
          </div>
        </div>
      ) : periods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-xs text-[var(--psm-muted)]">
          No reporting periods defined. Click &quot;Create Period&quot; to establish a cycle.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[11px] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">Period Name & Code</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Starts At</th>
                <th className="px-3 py-3">Ends At</th>
                <th className="px-3 py-3">Cut-off Date</th>
                <th className="px-4 py-3 text-right">Protection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--psm-line)]">
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--psm-surface-2)]/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--psm-text)]">{p.period_name}</div>
                    <div className="font-mono text-[11px] text-[var(--psm-muted)]">{p.period_code}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-500">
                      {p.period_status ?? 'OPEN'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">
                    {new Date(p.starts_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 text-[var(--psm-muted)]">
                    {new Date(p.ends_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--psm-text)]">
                    {new Date(p.cut_off_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-[var(--psm-muted)]">
                      <Lock className="h-3 w-3" />
                      <span>Immutable</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
