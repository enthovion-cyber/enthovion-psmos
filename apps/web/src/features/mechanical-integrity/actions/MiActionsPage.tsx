'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMiActions } from '../hooks/useMiActions';
import { ActionButton, PrimaryButton, SummaryGrid } from '../safeguards/SafeguardUiPrimitives';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { MiActionTable } from './MiActionTable';

export function MiActionsPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initialFilters });
  const query = useMiActions(filters);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load MI actions.</div>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-5"><header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p><h1 className="mt-1 text-2xl font-bold">Actions</h1><p className="mt-2 text-sm text-[var(--psm-muted)]">MI-specific wrapper view for Universal Action Engine linked repair, verification, review, document, and escalation actions.</p></div><div className="flex flex-wrap gap-2"><Link href="/mechanical-integrity/actions/new"><PrimaryButton>Create Action</PrimaryButton></Link><Link href="/mechanical-integrity/actions/my-actions"><ActionButton>My Actions</ActionButton></Link><Link href="/mechanical-integrity/actions/overdue"><ActionButton>Overdue</ActionButton></Link></div></div></header><SummaryGrid cards={[['Total Actions', rows.length], ['Open', rows.filter((row) => !['Closed','Cancelled'].includes(String(row.status))).length], ['Overdue', rows.filter((row) => row.due_date && new Date(row.due_date) < new Date()).length], ['Pending Approval', rows.filter((row) => ['Submitted','Waiting Approval'].includes(String(row.status))).length]]} /><section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search actions" value={String(filters.search ?? '')} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} /></section><MiActionTable rows={rows} /></div>;
}
