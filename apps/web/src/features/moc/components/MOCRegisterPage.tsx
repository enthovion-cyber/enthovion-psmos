'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FilePlus2, Filter, Search } from 'lucide-react';
import { mocService } from '../services/moc.service';
import { Badge, DetailCard, EmptyState, ErrorState, LoadingState, Metric, detailInput, riskTone, statusTone } from './moc-detail-ui';

export function MOCRegisterPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const query = useQuery({
    queryKey: ['moc', 'register', search, status, riskLevel],
    queryFn: () => mocService.list({ search: search || undefined, status: status || undefined, riskLevel: riskLevel || undefined, limit: 100 })
  });

  const rows = query.data ?? [];
  const stats = useMemo(() => ({
    total: rows.length,
    open: rows.filter((row) => !['Closed', 'Cancelled', 'Rejected'].includes(row.status)).length,
    high: rows.filter((row) => ['High', 'Critical'].includes(row.risk_level)).length,
    temp: rows.filter((row) => row.change_type === 'Temporary Change').length
  }), [rows]);

  return (
    <div className="space-y-6 text-[var(--psm-fg)] transition-colors w-full">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Module 04</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-[var(--psm-fg)] sm:text-3xl">
            Management of Change Register
          </h1>
          <p className="mt-1 text-xs text-[var(--psm-muted)] sm:text-sm">
            Live technical change ledger covering draft, under review, approved, implementation, PSSR, and closed changes.
          </p>
        </div>
        <Link
          href="/moc/new"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <FilePlus2 size={15} /> New MOC
        </Link>
      </header>

      {/* Metric Cards Row */}
      <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Metric label="Total MOCs" value={stats.total} tone="blue" />
        <Metric label="Active Open Changes" value={stats.open} tone="amber" />
        <Metric label="High & Critical Risk" value={stats.high} tone={stats.high ? 'red' : 'green'} />
        <Metric label="Temporary Changes" value={stats.temp} tone="purple" />
      </section>

      {/* Main Filter & Table Card */}
      <DetailCard
        title="Change Management Records"
        action={
          <div className="flex items-center gap-1.5 text-xs text-[var(--psm-muted)]">
            <Filter size={13} />
            <span>Realtime Synchronized</span>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="relative block sm:col-span-1">
            <Search className="absolute left-3 top-3 text-[var(--psm-muted)] pointer-events-none" size={15} />
            <input
              className={`${detailInput} pl-9`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search MOC #, title, description..."
            />
          </label>
          <select
            className={`${detailInput} cursor-pointer font-semibold`}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All Statuses</option>
            {['Draft', 'Submitted', 'Under Review', 'Approved', 'Implementation', 'Pending PSSR', 'Ready For Startup', 'Closed', 'Rejected', 'Cancelled', 'Overdue Temporary Change'].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            className={`${detailInput} cursor-pointer font-semibold`}
            value={riskLevel}
            onChange={(event) => setRiskLevel(event.target.value)}
          >
            <option value="">All Risk Levels</option>
            {['Low', 'Medium', 'High', 'Critical'].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <ErrorState message="Unable to load MOC register from API." /> : null}
        {!query.isLoading && !query.isError && !rows.length ? (
          <EmptyState title="No MOC records found" detail="Adjust search filters or create a new MOC request." />
        ) : null}

        {rows.length ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] uppercase tracking-wider text-[var(--psm-muted)] font-bold">
                <tr>
                  {['MOC Number', 'Title / Scope', 'Type', 'Status', 'Risk', 'Site / Unit', 'Originator', 'Target Date', 'Action'].map((header) => (
                    <th key={header} className="px-3.5 py-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--psm-surface-2)] transition-colors">
                    <td className="px-3.5 py-3 font-mono font-bold text-primary">
                      <Link href={`/moc/${row.id}`} className="hover:underline">
                        {row.moc_number}
                      </Link>
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-bold text-[var(--psm-fg)] truncate max-w-[280px]">{row.title}</p>
                      <p className="text-[11px] text-[var(--psm-muted)] truncate max-w-[280px]">{row.description}</p>
                    </td>
                    <td className="px-3.5 py-3 text-[var(--psm-fg)] font-medium">{row.change_type}</td>
                    <td className="px-3.5 py-3"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                    <td className="px-3.5 py-3"><Badge tone={riskTone(row.risk_level)}>{row.risk_level}</Badge></td>
                    <td className="px-3.5 py-3 text-[var(--psm-muted)]">
                      {row.site?.name ?? row.site_id} / {row.unit?.name ?? '-'}
                    </td>
                    <td className="px-3.5 py-3 text-[var(--psm-muted)]">{row.originator?.displayName ?? '-'}</td>
                    <td className="px-3.5 py-3 text-[var(--psm-muted)] font-mono">{row.target_implementation_date ?? '-'}</td>
                    <td className="px-3.5 py-3">
                      <Link
                        className="inline-flex items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-xs font-bold text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)] transition-colors"
                        href={`/moc/${row.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </DetailCard>

      {stats.high ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-bold text-rose-700 dark:text-rose-300">
          <AlertTriangle size={15} className="shrink-0" />
          <span>High and Critical risk MOCs require mandatory multi-discipline reviews, HAZOP validation, and hard PSSR pre-startup gate verification.</span>
        </div>
      ) : null}
    </div>
  );
}
