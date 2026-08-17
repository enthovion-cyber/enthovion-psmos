'use client';

import { SectionCard } from '../safeguards/SafeguardUiPrimitives';

export function WorkOrderTimeline({ events = [] }: { events?: Array<Record<string, unknown>> | undefined }) {
  return <SectionCard title="Timeline / History" description="Audit-backed MI work order history events.">{!events.length ? <p className="text-sm text-[var(--psm-muted)]">No history events recorded.</p> : <div className="space-y-2">{events.slice(0, 20).map((event) => <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{String(event.event_title ?? event.event_type ?? 'Event')}</p><p className="text-xs text-[var(--psm-muted)]">{String(event.created_at ?? '')} · {String(event.actor_user_id ?? '')}</p></div>)}</div>}</SectionCard>;
}
