import { cardValue } from '../safeguards/SafeguardUiPrimitives';

export function ReadinessTimeline({ events }: { events?: Array<Record<string, unknown>> | undefined }) {
  if (!events?.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">No readiness history events recorded.</div>;
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <p className="font-semibold">{cardValue(event.event_title ?? event.event_type)}</p>
          <p className="text-sm text-[var(--psm-muted)]">{cardValue(event.event_description)}</p>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">{cardValue(event.created_at)} | Actor: {cardValue(event.actor_user_id)}</p>
        </li>
      ))}
    </ol>
  );
}
