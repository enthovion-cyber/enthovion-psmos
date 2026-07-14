import type { HazopHistoryEvent } from '../../types/hazop-history.types';

export function HazopSafetyCriticalEventsPanel({ events, onOpen }: { events: HazopHistoryEvent[]; onOpen: (event: HazopHistoryEvent) => void }) {
  return <section className="rounded-xl border border-red-500/25 bg-red-500/10 p-4"><h3 className="mb-3 font-semibold text-red-100">Safety-Critical Events</h3>{events.slice(0, 8).map((event) => <button key={event.id} onClick={() => onOpen(event)} className="mb-2 w-full rounded-lg border border-red-500/20 bg-black/10 p-3 text-left text-sm"><div className="font-semibold text-red-100">{event.event_title ?? event.title}</div><div className="text-xs text-red-100/70">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'}</div></button>)}{!events.length ? <p className="text-sm text-red-100/70">No safety-critical events returned.</p> : null}</section>;
}
