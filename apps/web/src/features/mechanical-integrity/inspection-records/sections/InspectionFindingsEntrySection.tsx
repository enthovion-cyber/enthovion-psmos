'use client';

import { useState } from 'react';
import { InspectionFindingSeverityBadge } from '../../shared/InspectionFindingSeverityBadge';
import type { MiInspectionFinding } from '../../types/inspection-record.types';

export function InspectionFindingsEntrySection({ rows, onAdd, onClose, saving }: { rows: MiInspectionFinding[]; onAdd?: ((input: Record<string, unknown>) => void) | undefined; onClose?: ((findingId: string) => void) | undefined; saving?: boolean | undefined }) {
  const [form, setForm] = useState({ title: '', findingType: 'Other', severity: 'Medium', description: '', recommendedAction: '' });
  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-bold text-[var(--psm-text)]">Findings / Defects</h2><span className="text-sm text-[var(--psm-muted)]">{rows.length} findings</span></div>
      {onAdd ? <div className="mt-4 grid gap-3 md:grid-cols-5">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] md:col-span-2" placeholder="Finding title" value={form.title} onChange={(event) => set('title', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={form.findingType} onChange={(event) => set('findingType', event.target.value)}>{['Thickness below alert','Thickness below minimum','Corrosion observed','Crack indication','Leak','Documentation gap','Other'].map((item) => <option key={item}>{item}</option>)}</select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={form.severity} onChange={(event) => set('severity', event.target.value)}>{['Low','Medium','High','Critical'].map((item) => <option key={item}>{item}</option>)}</select>
        <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !form.title} onClick={() => onAdd(form)}>{saving ? 'Saving...' : 'Add Finding'}</button>
      </div> : null}
      <div className="mt-4 grid gap-3">
        {rows.length ? rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><p className="font-semibold text-[var(--psm-text)]">{row.finding_number ? `${row.finding_number} - ` : ''}{row.title}</p><p className="text-sm text-[var(--psm-muted)]">{row.finding_type} • {row.status ?? 'Open'}</p><p className="mt-1 text-sm text-[var(--psm-muted)]">{row.description ?? row.recommended_action ?? 'No notes recorded.'}</p></div><div className="flex items-center gap-2"><InspectionFindingSeverityBadge value={row.severity} />{onClose && row.status !== 'Closed' ? <button className="rounded border border-[var(--psm-line)] px-2 py-1 text-xs font-semibold" onClick={() => onClose(row.id)}>Close</button> : null}</div></div></div>) : <p className="text-sm text-[var(--psm-muted)]">No findings recorded.</p>}
      </div>
    </section>
  );
}
