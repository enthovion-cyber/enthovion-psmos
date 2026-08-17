'use client';

import { useState } from 'react';
import type { MiCmlReading } from '../types/cml.types';

export function CmlReadingHistoryTable({ rows, onAdd, onApprove, saving }: { rows: MiCmlReading[]; onAdd: (input: Record<string, unknown>) => void; onApprove: (id: string) => void; saving?: boolean }) {
  const [form, setForm] = useState({ readingDate: '', thicknessValue: '', thicknessUnit: 'mm', inspectionMethod: 'UT thickness', notes: '' });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-[var(--psm-text)]">UT Thickness Reading History</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" type="date" value={form.readingDate} onChange={(event) => setForm({ ...form, readingDate: event.target.value })} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" placeholder="Thickness" value={form.thicknessValue} onChange={(event) => setForm({ ...form, thicknessValue: event.target.value })} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={form.thicknessUnit} onChange={(event) => setForm({ ...form, thicknessUnit: event.target.value })} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={form.inspectionMethod} onChange={(event) => setForm({ ...form, inspectionMethod: event.target.value })} />
        <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !form.readingDate || !form.thicknessValue} onClick={() => onAdd(form)}>{saving ? 'Saving...' : 'Add Reading'}</button>
      </div>
      {!rows.length ? <p className="mt-4 text-sm text-[var(--psm-muted)]">No thickness readings recorded yet.</p> : <div className="mt-4 overflow-hidden rounded-lg border border-[var(--psm-line)]"><table className="w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="p-3">Date</th><th className="p-3">Thickness</th><th className="p-3">Method</th><th className="p-3">Review</th><th className="p-3">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="p-3">{row.reading_date}</td><td className="p-3">{String(row.thickness_value)} {row.thickness_unit}</td><td className="p-3">{row.inspection_method ?? '-'}</td><td className="p-3">{row.review_status ?? row.status}</td><td className="p-3">{row.review_status !== 'Approved' ? <button className="rounded border border-[var(--psm-line)] px-2 py-1 text-xs font-semibold" onClick={() => onApprove(row.id)}>Approve</button> : null}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
