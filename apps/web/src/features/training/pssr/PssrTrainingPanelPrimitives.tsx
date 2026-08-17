import Link from 'next/link';
import type { ReactNode } from 'react';
import { TrainingBadge, TrainingButton, TrainingCard, TrainingEmptyState, TrainingProgress } from '../shared/TrainingUi';

export function valueText(value: unknown, fallback = 'Not recorded') {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function MiniField({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm font-semibold text-[var(--psm-fg)]">{valueText(value)}</p></div>;
}

export function PanelGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function RowsPanel({ title, subtitle, rows, emptyTitle, emptyMessage, children }: { title: string; subtitle?: string | undefined; rows?: any[] | undefined; emptyTitle: string; emptyMessage: string; children: (rows: any[]) => ReactNode }) {
  const safeRows = rows ?? [];
  return <TrainingCard title={title} subtitle={subtitle}>{safeRows.length ? children(safeRows) : <TrainingEmptyState title={emptyTitle} message={emptyMessage} />}</TrainingCard>;
}

export function SimpleTable({ rows, columns }: { rows?: any[] | undefined; columns: Array<{ key: string; label: string; render?: (row: any) => ReactNode }> }) {
  const safeRows = rows ?? [];
  if (!safeRows.length) return <TrainingEmptyState title="No records returned" message="The backend did not return rows for this register in the current scope." />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>{columns.map((column) => <th key={column.key} className="px-3 py-2">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {safeRows.map((row) => <tr key={String(row.id ?? row.key ?? JSON.stringify(row))} className="border-t border-[var(--psm-line)] align-top">
            {columns.map((column) => <td key={column.key} className="px-3 py-3">{column.render ? column.render(row) : valueText(row[column.key])}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function BlockerList({ rows }: { rows?: any[] | undefined }) {
  const safeRows = rows ?? [];
  if (!safeRows.length) return <TrainingEmptyState title="No blockers returned" message="Approval, handover and startup blockers will appear here when backend readiness detects them." />;
  return <div className="space-y-2">{safeRows.map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{valueText(row.blocker_title ?? row.blockerTitle ?? row.blocker_type)}</p><p className="text-xs text-[var(--psm-muted)]">{valueText(row.blocker_description ?? row.description ?? row.blocker_type)}</p></div><TrainingBadge tone={row.blocker_status === 'Open' ? 'danger' : 'warn'}>{valueText(row.blocker_status)}</TrainingBadge></div></div>)}</div>;
}

export function SmallBar({ label, value }: { label: string; value: number }) {
  return <div><div className="mb-1 flex justify-between text-xs text-[var(--psm-muted)]"><span>{label}</span><span>{value}%</span></div><TrainingProgress value={value} /></div>;
}

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return <TrainingButton href={href} variant="secondary">{children}</TrainingButton>;
}

export function ReadinessLink({ row }: { row: any }) {
  return <Link className="font-semibold text-primary hover:underline" href={`/training-competency/pssr-training-readiness/${row.id}`}>{valueText(row.readiness_title ?? row.readiness_code ?? row.id)}</Link>;
}

