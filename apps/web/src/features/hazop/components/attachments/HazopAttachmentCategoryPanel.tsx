import type { ReactNode } from 'react';
import type { HazopAttachment } from '../../types/hazop-attachment.types';

export function HazopAttachmentCategoryPanel({ rows }: { rows: HazopAttachment[] }) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.category ?? 'Other']: (acc[row.category ?? 'Other'] ?? 0) + 1 }), {});
  return <Panel title="Category Panel">{Object.entries(counts).map(([category, count]) => <div key={category} className="mb-2 flex justify-between rounded-lg border border-[var(--psm-line)] p-3 text-sm"><span>{category}</span><span className="font-semibold">{count}</span></div>)}{!rows.length ? <p className="text-sm text-[var(--psm-muted)]">No categories yet.</p> : null}</Panel>;
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="mb-3 font-semibold">{title}</h3>{children}</section>;
}
