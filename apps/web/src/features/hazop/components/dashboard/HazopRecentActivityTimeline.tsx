import Link from 'next/link';

export function HazopRecentActivityTimeline({ events }: { events: any[] }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent HAZOP Activity</h3><span className="text-xs text-blue-300">View all</span></div>
      <div className="space-y-3">
        {events.slice(0, 8).map((event) => <Link key={event.id} href={`/hazop/${event.study_id}?tab=History`} className="grid grid-cols-[18px_1fr] gap-3"><span className="mt-1 h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_0_4px_rgba(59,130,246,.15)]" /><span><span className="block text-sm font-semibold">{event.title ?? event.event_type ?? 'HAZOP event'}</span><span className="block text-xs text-[var(--psm-muted)]">{event.description ?? event.section ?? ''}</span><span className="block text-[11px] text-[var(--psm-muted)]">{event.created_at ? new Date(event.created_at).toLocaleString() : ''}</span></span></Link>)}
        {!events.length ? <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">No HAZOP history events yet.</div> : null}
      </div>
    </section>
  );
}
