'use client';

import { useState } from 'react';

export function SchedulerRuleForm({ onSubmit, saving }: { onSubmit: (input: Record<string, unknown>) => void; saving?: boolean }) {
  const [value, setValue] = useState({ ruleName: '', maximumIntervalValue: '1', maximumIntervalUnit: 'Years', dueSoonThresholdValue: '30', criticalOverdueThresholdValue: '30' });
  const set = (key: string, next: string) => setValue((current) => ({ ...current, [key]: next }));
  return <form className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-5" onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}><input value={value.ruleName} onChange={(e) => set('ruleName', e.target.value)} placeholder="Rule name" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" /><input value={value.maximumIntervalValue} onChange={(e) => set('maximumIntervalValue', e.target.value)} placeholder="Max interval" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" /><select value={value.maximumIntervalUnit} onChange={(e) => set('maximumIntervalUnit', e.target.value)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-[var(--psm-text)]"><option>Days</option><option>Months</option><option>Years</option></select><input value={value.dueSoonThresholdValue} onChange={(e) => set('dueSoonThresholdValue', e.target.value)} placeholder="Due soon days" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" /><button disabled={saving} className="rounded-lg bg-info px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Save rule</button></form>;
}
