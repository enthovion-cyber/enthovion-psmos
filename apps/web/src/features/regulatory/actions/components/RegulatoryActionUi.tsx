import Link from 'next/link';
import { RegulatoryActionPriorityBadge } from '../../shared/RegulatoryActionPriorityBadge';
import { RegulatoryActionReadinessBadge } from '../../shared/RegulatoryActionReadinessBadge';
import { RegulatoryActionStatusBadge } from '../../shared/RegulatoryActionStatusBadge';
import { RegulatoryActionSyncStatusBadge } from '../../shared/RegulatoryActionSyncStatusBadge';
import { RegulatoryBadge, RegulatoryButton, RegulatoryCard, RegulatoryEmptyState } from '../../shared/RegulatoryUi';
import type { RegulatoryActionRow, RegulatoryActionSummary, RegulatoryCapaPackage } from '../../types/regulatory-action.types';

export function valueText(value: unknown, fallback = 'Not set') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ActionSummaryCards({ summary }: { summary?: RegulatoryActionSummary | undefined }) {
  const cards: Array<[string, unknown, string, 'neutral' | 'good' | 'warn' | 'danger' | 'info']> = [
    ['Total links', summary?.total, '/regulatory/actions/register', 'info'],
    ['Open', summary?.open, '/regulatory/actions/open', 'warn'],
    ['Overdue', summary?.overdue, '/regulatory/actions/overdue', 'danger'],
    ['Completed', summary?.completed, '/regulatory/actions/completed', 'good'],
    ['Pending verification', summary?.pendingVerification, '/regulatory/actions/pending-verification', 'warn'],
    ['Verification failed', summary?.verificationFailed, '/regulatory/actions/verification-failed', 'danger'],
    ['Effectiveness pending', summary?.effectivenessPending, '/regulatory/actions/effectiveness-pending', 'warn'],
    ['Ineffective', summary?.ineffective, '/regulatory/actions/ineffective', 'danger'],
    ['Ready for gap closure', summary?.readyForGapClosure, '/regulatory/actions/ready-for-gap-closure', 'good'],
    ['Blocking compliance', summary?.blockingCompliance, '/regulatory/actions/blocking-compliance', 'danger'],
    ['No action', summary?.noAction, '/regulatory/actions/no-action', 'neutral'],
    ['Stale sync', summary?.staleSync, '/regulatory/actions/stale-sync', 'warn']
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, href, tone]) => (
        <Link key={label} href={href} className={`rounded-xl border p-4 transition hover:-translate-y-0.5 ${tone === 'danger' ? 'border-danger/30 bg-danger/10' : tone === 'warn' ? 'border-amber-500/30 bg-amber-500/10' : tone === 'good' ? 'border-emerald-500/30 bg-emerald-500/10' : tone === 'info' ? 'border-primary/30 bg-primary/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface)]'}`}>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">{valueText(value, '0')}</p>
        </Link>
      ))}
    </div>
  );
}

export function RegulatoryActionTable({ rows, onRefresh, title = 'Regulatory Action Register' }: { rows?: RegulatoryActionRow[] | undefined; onRefresh?: (() => void) | undefined; title?: string | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No regulatory actions found" message="No action links were returned by the backend for this scope and filter." action={onRefresh ? <RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton> : undefined} />;
  return (
    <RegulatoryCard title={title} subtitle="Universal Action Engine, Audit CAPA, and regulatory source links" action={onRefresh ? <RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton> : undefined}>
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
            <tr>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Mode</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Readiness</th>
              <th className="px-3 py-2">Sync</th>
              <th className="px-3 py-2">Due</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-3 py-3">
                  <Link href={`/regulatory/actions/links/${row.id}`} className="font-semibold text-primary hover:underline">{row.action_link_code ?? row.id}</Link>
                  <div className="text-[var(--psm-fg)]">{row.action_link_title ?? 'Untitled action'}</div>
                </td>
                <td className="px-3 py-3"><RegulatoryBadge>{row.source_type ?? 'Manual'}</RegulatoryBadge></td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{row.action_mode ?? 'Not set'}</td>
                <td className="px-3 py-3"><RegulatoryActionPriorityBadge value={row.action_priority} /></td>
                <td className="px-3 py-3"><RegulatoryActionStatusBadge value={row.action_status} /></td>
                <td className="px-3 py-3"><RegulatoryActionReadinessBadge value={row.closure_readiness_status} /></td>
                <td className="px-3 py-3"><RegulatoryActionSyncStatusBadge value={row.sync_status} /></td>
                <td className="px-3 py-3 text-[var(--psm-muted)]">{formatDate(row.due_date)}</td>
                <td className="px-3 py-3"><RegulatoryButton href={`/regulatory/actions/links/${row.id}`} variant="secondary">Open</RegulatoryButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RegulatoryCard>
  );
}

export function ReadinessPanel({ readiness, row }: { readiness?: Record<string, unknown> | undefined; row?: RegulatoryActionRow | undefined }) {
  const blockers = (readiness?.blockers ?? row?.blockers_json ?? []) as unknown[];
  return (
    <RegulatoryCard title="Closure Readiness / Blockers" subtitle="Backend-generated readiness for compliance and gap closure">
      <div className="flex flex-wrap gap-2">
        <RegulatoryActionReadinessBadge value={valueText(readiness?.status ?? row?.closure_readiness_status, 'Not Checked')} />
        <RegulatoryBadge tone={blockers.length ? 'danger' : 'good'}>{blockers.length} blockers</RegulatoryBadge>
      </div>
      {blockers.length ? <ul className="mt-4 space-y-2 text-sm text-[var(--psm-fg)]">{blockers.map((item, index) => <li key={index} className="rounded-lg border border-danger/20 bg-danger/10 p-3">{valueText(item)}</li>)}</ul> : <p className="mt-4 text-sm text-[var(--psm-muted)]">No backend blockers returned for this action scope.</p>}
    </RegulatoryCard>
  );
}

export function CapaPackageTable({ rows, onRefresh }: { rows?: RegulatoryCapaPackage[] | undefined; onRefresh?: (() => void) | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No regulatory CAPA packages found" message="No CAPA package foundation records were returned by the backend." action={onRefresh ? <RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton> : undefined} />;
  return (
    <RegulatoryCard title="Regulatory CAPA Packages" subtitle="Foundation packages grouping regulatory sources and action links" action={onRefresh ? <RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton> : undefined}>
      <div className="grid gap-3">
        {rows.map((row) => (
          <Link key={row.id} href={`/regulatory/actions/capa/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 hover:border-primary/50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--psm-fg)]">{row.capa_package_code ?? row.id} · {row.capa_package_title ?? 'Untitled CAPA package'}</p>
                <p className="mt-1 text-sm text-[var(--psm-muted)]">{row.capa_package_type ?? 'Regulatory CAPA'} · Due {formatDate(row.due_date)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <RegulatoryActionReadinessBadge value={row.closure_readiness_status} />
                <RegulatoryBadge>{row.package_status ?? 'Open Foundation'}</RegulatoryBadge>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </RegulatoryCard>
  );
}
