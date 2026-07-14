'use client';

import type { HazopIplCriterion } from '../../types/hazop-safeguard.types';

export function HazopIplChecklist({ items, onChange }: { items: HazopIplCriterion[]; onChange: (items: HazopIplCriterion[]) => void }) {
  const update = (index: number, patch: Partial<HazopIplCriterion>) => onChange(items.map((item, i) => i === index ? { ...item, ...patch } : item));
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.criterion_key} className="rounded-lg border border-[var(--psm-line)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="font-semibold">{item.criterion_label}</div><div className="text-xs text-[var(--psm-muted)]">{item.required ? 'Required IPL criterion' : 'Optional evidence criterion'}</div></div>
            <select className="input w-48" value={item.result ?? 'Needs Evidence'} onChange={(event) => update(index, { result: event.target.value as NonNullable<HazopIplCriterion['result']> })}>
              <option>Pass</option><option>Fail</option><option>Not Applicable</option><option>Needs Evidence</option>
            </select>
          </div>
          <input className="input mt-2" value={item.comment ?? ''} onChange={(event) => update(index, { comment: event.target.value })} placeholder="Evidence note / validation comment" />
        </div>
      ))}
    </div>
  );
}
