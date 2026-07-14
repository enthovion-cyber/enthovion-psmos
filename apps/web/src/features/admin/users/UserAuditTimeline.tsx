'use client';

export function UserAuditTimeline({ events }: { events?: Array<{ id?: string; action?: string; createdAt?: string }> }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Audit History</h2>
      <div className="mt-3 space-y-2">
        {(events ?? []).map((event, index) => <div key={event.id ?? index} className="rounded-md border border-[var(--psm-line)] p-3 text-sm">{event.action ?? 'Audit event'} <span className="text-xs text-[var(--psm-muted)]">{event.createdAt ?? ''}</span></div>)}
        {!(events ?? []).length ? <p className="text-sm text-[var(--psm-muted)]">No audit events loaded.</p> : null}
      </div>
    </section>
  );
}
