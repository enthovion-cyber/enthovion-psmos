'use client';

export function CmlAlertPanel({ alerts }: { alerts: Array<Record<string, unknown>> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-[var(--psm-text)]">CML Alert / Threshold Status</h3>
      {!alerts.length ? <p className="mt-3 text-sm text-success">No open CML alerts.</p> : <div className="mt-4 space-y-3">{alerts.map((alert) => <div key={String(alert.id)} className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm"><strong className="text-danger">{String(alert.title ?? alert.alert_type)}</strong><p className="text-[var(--psm-muted)]">{String(alert.description ?? '')}</p></div>)}</div>}
    </section>
  );
}
