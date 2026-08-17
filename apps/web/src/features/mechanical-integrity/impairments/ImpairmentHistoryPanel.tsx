import { SectionCard } from '../safeguards/SafeguardUiPrimitives';

export function ImpairmentHistoryPanel({ history }: { history?: Array<Record<string, unknown>> }) {
  return (
    <SectionCard title="History / Audit Trail" description="Immutable MI history events generated for create, update, approval, activation, extension, restoration, verification, close, and linked-record actions.">
      {history?.length ? <div className="space-y-3">{history.map((event) => <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{String(event.event_title ?? event.event_type)}</p><p className="text-xs text-[var(--psm-muted)]">{String(event.created_at ?? '')} · {String(event.reason ?? event.event_description ?? '')}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No history events yet.</p>}
    </SectionCard>
  );
}
