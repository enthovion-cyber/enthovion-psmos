export function EquipmentRecentActivityCard({ items }: { items: Array<Record<string, unknown>> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Recent Activity / Equipment Timeline Preview</h2>
      <div className="mt-4 divide-y divide-[var(--psm-line)]">
        {items.length === 0 ? <p className="text-sm text-[var(--psm-muted)]">No recent activity returned.</p> : items.map((item, index) => <div key={String(item.id ?? index)} className="py-3"><div className="font-semibold">{String(item.title ?? item.eventType ?? 'Event')}</div><div className="text-xs text-[var(--psm-muted)]">{String(item.occurredAt ?? item.created_at ?? '')}</div></div>)}
      </div>
    </section>
  );
}
