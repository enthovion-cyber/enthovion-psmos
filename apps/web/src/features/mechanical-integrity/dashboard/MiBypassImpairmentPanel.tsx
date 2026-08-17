import type { MiEquipment } from '../types/equipment.types';
import { BypassStatusBadge } from '../shared/BypassStatusBadge';

export function MiBypassImpairmentPanel({ items }: { items: MiEquipment[] }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Active Bypass / Impairment</h2>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? <p className="text-sm text-[var(--psm-muted)]">No active bypass or impairment records returned.</p> : items.map((item) => (
          <div key={item.id} className="rounded-lg border border-[var(--psm-line)] p-3">
            <div className="flex items-center justify-between gap-2"><span className="font-semibold">{item.tag}</span><BypassStatusBadge active={item.bypassActive} /></div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">{item.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
