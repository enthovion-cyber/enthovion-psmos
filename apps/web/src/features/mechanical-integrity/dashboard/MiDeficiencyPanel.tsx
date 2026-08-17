import type { MiEquipment } from '../types/equipment.types';
import { DeficiencyStatusBadge } from '../shared/DeficiencyStatusBadge';

export function MiDeficiencyPanel({ items }: { items: MiEquipment[] }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Open Deficiencies</h2>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? <p className="text-sm text-[var(--psm-muted)]">No open deficiencies returned by backend.</p> : items.map((item) => (
          <div key={item.id} className="rounded-lg border border-[var(--psm-line)] p-3">
            <div className="flex items-center justify-between gap-2"><span className="font-semibold">{item.tag}</span><DeficiencyStatusBadge count={item.openDeficiencyCount} /></div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">{item.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
