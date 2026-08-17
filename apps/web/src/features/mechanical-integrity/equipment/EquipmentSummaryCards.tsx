import type { MiKpi } from '../types/equipment.types';

export function EquipmentSummaryCards({ cards }: { cards: MiKpi[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold">{card.value}</div>
        </div>
      ))}
    </section>
  );
}
