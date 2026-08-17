export function EquipmentIntegrityStatusCards({ cards }: { cards: Array<{ label: string; value: string }> }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => <div key={card.label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="text-xs text-[var(--psm-muted)]">{card.label}</div><div className="mt-2 text-lg font-semibold">{card.value}</div></div>)}
    </section>
  );
}
