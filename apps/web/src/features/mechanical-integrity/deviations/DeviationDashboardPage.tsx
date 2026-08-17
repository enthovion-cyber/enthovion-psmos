'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDeviations } from '../hooks/useDeviations';
import { ActionButton, PrimaryButton, SectionCard, SummaryGrid, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { DeviationStatusBadge } from '../shared/DeviationStatusBadge';

export function DeviationDashboardPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initialFilters });
  const query = useDeviations(filters);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load deviations.</div>;
  const rows = query.data?.rows ?? [];
  const today = new Date();
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p>
            <h1 className="mt-1 text-2xl font-bold">Deviation Register</h1>
            <p className="mt-2 text-sm text-[var(--psm-muted)]">Temporary operation with restrictions, interval extensions, temporary repairs, FFS temporary acceptance, and startup-with-condition records.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/mechanical-integrity/deviations/new"><PrimaryButton>Create Deviation</PrimaryButton></Link>
            <a href="/api/v1/mechanical-integrity/deviations/export"><ActionButton>Export</ActionButton></a>
            <ActionButton onClick={() => void query.refetch()}>Refresh</ActionButton>
          </div>
        </div>
      </header>
      <SummaryGrid cards={[
        ['Total Deviations', rows.length],
        ['Active', rows.filter((row) => ['Approved','Active','Expiring Soon'].includes(String(row.status))).length],
        ['Expiring Soon', rows.filter((row) => row.status === 'Expiring Soon' || (row.expiry_date && new Date(row.expiry_date) <= new Date(today.getTime() + 14 * 86400000))).length],
        ['Expired', rows.filter((row) => row.status === 'Expired' || (row.expiry_date && new Date(row.expiry_date) < today)).length],
        ['Pending Approval', rows.filter((row) => ['Submitted','Pending Approval'].includes(String(row.status))).length],
        ['Pending Closure Verification', rows.filter((row) => row.status === 'Pending Closure Verification').length]
      ]} />
      <SectionCard title="Filters / Search" description="Server-side filters are applied by status, equipment, and pagination.">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search" value={String(filters.search ?? '')} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} />
          <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.status ?? '')} onChange={(event) => setFilters({ ...filters, status: event.target.value || undefined, page: 1 })}>
            <option value="">All statuses</option>
            {['Draft','Submitted','Pending Approval','Approved','Active','Expiring Soon','Expired','Extension Requested','Extension Approved','Pending Closure Verification','Closed','Rejected','Cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold" type="button" onClick={() => setFilters({ page: 1, limit: 25, sort: 'updated_at.desc' })}>Clear</button>
        </div>
      </SectionCard>
      <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
        <table className="min-w-[1050px] w-full text-left text-sm">
          <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Record','Title','Equipment','Type','Status','Start','Expiry','Owner','Approver','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-4 py-3 font-semibold">{cardValue(row.record_number)}</td><td className="px-4 py-3">{cardValue(row.title)}</td><td className="px-4 py-3">{cardValue(row.equipment_tag ?? row.equipment_id)}</td><td className="px-4 py-3">{cardValue(row.deviation_type)}</td><td className="px-4 py-3"><DeviationStatusBadge status={row.status} /></td><td className="px-4 py-3">{cardValue(row.start_date)}</td><td className="px-4 py-3">{cardValue(row.expiry_date)}</td><td className="px-4 py-3">{cardValue(row.owner_user_id)}</td><td className="px-4 py-3">{cardValue(row.approver_user_id)}</td><td className="px-4 py-3"><Link href={`/mechanical-integrity/deviations/${row.id}`}><ActionButton>Open</ActionButton></Link></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
