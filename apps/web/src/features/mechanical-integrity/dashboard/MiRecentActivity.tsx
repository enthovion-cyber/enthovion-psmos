export function MiRecentActivity({ items }: { items: Array<Record<string, unknown>> }) {
  return (
    <section className="psm-card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Recent Activity</h2>
      <div className="mt-4 divide-y divide-[var(--psm-line)]">
        {items.length === 0 ? <p className="text-sm text-[var(--psm-muted)]">No MI history events returned yet.</p> : items.map((item, index) => (
          <div key={String(item.id ?? index)} className="py-3">
            <div className="font-semibold">{String(item.title ?? item.eventType ?? 'MI event')}</div>
            <div className="mt-1 text-xs text-[var(--psm-muted)]">{String(item.occurredAt ?? item.created_at ?? '')}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
