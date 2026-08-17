'use client';

import { useState } from 'react';

export function PmPlanForm({ initial, saving, onSubmit }: { initial?: Record<string, any>; saving?: boolean; onSubmit: (input: Record<string, unknown>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({
    equipmentId: initial?.equipment_id ?? initial?.equipmentId ?? '',
    planTitle: initial?.plan_title ?? initial?.planTitle ?? '',
    pmCategory: initial?.pm_category ?? '',
    pmTaskType: initial?.pm_task_type ?? '',
    frequencyValue: initial?.frequency_value ?? '',
    frequencyUnit: initial?.frequency_unit ?? 'Months',
    priority: initial?.priority ?? 'Normal',
    notes: initial?.notes ?? ''
  });
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form className="space-y-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">Equipment ID<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.equipmentId} onChange={(event) => set('equipmentId', event.target.value)} required /></label>
        <label className="text-sm font-semibold">Plan title<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.planTitle} onChange={(event) => set('planTitle', event.target.value)} required /></label>
        <label className="text-sm font-semibold">PM category<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.pmCategory} onChange={(event) => set('pmCategory', event.target.value)} /></label>
        <label className="text-sm font-semibold">PM task type<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.pmTaskType} onChange={(event) => set('pmTaskType', event.target.value)} required /></label>
        <label className="text-sm font-semibold">Frequency value<input type="number" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.frequencyValue} onChange={(event) => set('frequencyValue', event.target.value)} /></label>
        <label className="text-sm font-semibold">Frequency unit<select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.frequencyUnit} onChange={(event) => set('frequencyUnit', event.target.value)}>{['Days', 'Weeks', 'Months', 'Years'].map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label className="block text-sm font-semibold">Notes<textarea className="mt-1 min-h-28 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2" value={form.notes} onChange={(event) => set('notes', event.target.value)} /></label>
      <button className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} title={saving ? 'Saving PM plan' : 'Save PM plan'}>{saving ? 'Saving...' : 'Save PM Plan'}</button>
    </form>
  );
}

