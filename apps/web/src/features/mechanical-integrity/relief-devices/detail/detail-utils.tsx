import type { ReactNode } from 'react';

export function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><h2 className="mb-3 font-semibold">{title}</h2>{children}</section>;
}

export function KeyValueGrid({ data }: { data?: Record<string, unknown> | null | undefined }) {
  const entries = Object.entries(data ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (!entries.length) return <p className="text-sm text-[var(--psm-muted)]">No data recorded yet.</p>;
  return <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{entries.slice(0, 30).map(([key, value]) => <div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><dt className="text-xs text-[var(--psm-muted)]">{key.replace(/_/g, ' ')}</dt><dd className="mt-1 text-sm font-semibold">{String(value)}</dd></div>)}</dl>;
}
