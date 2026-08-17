'use client';

import { useState } from 'react';
import { UtReadingStatusBadge } from '../../shared/UtReadingStatusBadge';
import type { MiInspectionReading } from '../../types/inspection-record.types';

export function InspectionReadingsEntrySection({ rows, onAdd, onApprove, saving }: { rows: MiInspectionReading[]; onAdd?: ((input: Record<string, unknown>) => void) | undefined; onApprove?: ((readingId: string) => void) | undefined; saving?: boolean | undefined }) {
  const [form, setForm] = useState({ cmlId: '', readingDate: '', currentThickness: '', thicknessUnit: 'mm', inspectorName: '', surfaceCondition: '', scanDirection: '', notes: '' });
  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-bold text-[var(--psm-text)]">CML / TML UT Readings</h2><span className="text-sm text-[var(--psm-muted)]">{rows.length} readings</span></div>
      {onAdd ? <div className="mt-4 grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" placeholder="CML ID" value={form.cmlId} onChange={(event) => set('cmlId', event.target.value)} />
        <input type="date" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={form.readingDate} onChange={(event) => set('readingDate', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" placeholder="Thickness" value={form.currentThickness} onChange={(event) => set('currentThickness', event.target.value)} />
        <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !form.cmlId || !form.readingDate || !form.currentThickness} onClick={() => onAdd(form)} title={!form.cmlId || !form.readingDate || !form.currentThickness ? 'CML, date and thickness are required.' : undefined}>{saving ? 'Saving...' : 'Add Reading'}</button>
      </div> : null}
      <div className="mt-4 overflow-hidden rounded-lg border border-[var(--psm-line)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="p-3">CML</th><th className="p-3">Date</th><th className="p-3">Current</th><th className="p-3">Previous</th><th className="p-3">Alert</th><th className="p-3">Review</th><th className="p-3">Actions</th></tr></thead>
          <tbody>{rows.length ? rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="p-3">{row.cmlNumber ?? row.cml_id}</td><td className="p-3">{row.reading_date ?? '-'}</td><td className="p-3">{row.current_thickness ?? '-'} {row.thickness_unit ?? ''}</td><td className="p-3">{row.previous_approved_thickness ?? '-'}</td><td className="p-3">{row.alert_state ?? '-'}</td><td className="p-3"><UtReadingStatusBadge value={row.review_status ?? row.reading_status} /></td><td className="p-3">{onApprove && row.review_status !== 'Approved' ? <button className="rounded border border-[var(--psm-line)] px-2 py-1 text-xs font-semibold" onClick={() => onApprove(row.id)}>Approve</button> : null}</td></tr>) : <tr><td colSpan={7} className="p-5 text-center text-[var(--psm-muted)]">No UT readings recorded.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  );
}
