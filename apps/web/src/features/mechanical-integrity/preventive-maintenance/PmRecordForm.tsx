'use client';

import { useState } from 'react';

export function PmRecordForm({ initial, saving, onSubmit }: { initial?: Record<string, any>; saving?: boolean; onSubmit: (input: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({ equipmentId: initial?.equipment_id ?? '', planId: initial?.plan_id ?? '', pmDate: initial?.pm_date ?? new Date().toISOString().slice(0, 10), technicianName: initial?.technician_name ?? '', result: initial?.result ?? '', notes: initial?.notes ?? '' });
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="space-y-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" placeholder="Equipment ID" value={form.equipmentId} onChange={(event) => set('equipmentId', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" placeholder="Plan ID" value={form.planId} onChange={(event) => set('planId', event.target.value)} />
        <input type="date" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.pmDate} onChange={(event) => set('pmDate', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" placeholder="Technician" value={form.technicianName} onChange={(event) => set('technicianName', event.target.value)} />
      </div>
      <textarea className="min-h-28 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" placeholder="Notes" value={form.notes} onChange={(event) => set('notes', event.target.value)} />
      <button className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white" disabled={saving}>{saving ? 'Saving...' : 'Save PM Record'}</button>
    </form>
  );
}

