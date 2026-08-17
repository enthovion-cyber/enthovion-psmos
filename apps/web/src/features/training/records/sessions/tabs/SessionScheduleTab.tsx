'use client';

import { TrainingCard } from '../../../shared/TrainingUi';

export function SessionScheduleTab({ session }: { session: Record<string, any> }) {
  return <TrainingCard title="Schedule / Location"><dl className="grid gap-3 text-sm md:grid-cols-3">{Object.entries({ Start: session.start_time, End: session.end_time, Timezone: session.timezone, Site: session.siteName ?? session.site_id, Unit: session.unitName ?? session.unit_id, Area: session.areaName ?? session.area_id, Room: session.room_name, 'Online link': session.online_meeting_url, 'Capacity': session.capacity }).map(([k, v]) => <div key={k} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{k}</dt><dd className="mt-1 font-semibold">{String(v ?? '-')}</dd></div>)}</dl></TrainingCard>;
}
