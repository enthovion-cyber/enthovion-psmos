import { Clock3 } from 'lucide-react';
import { LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaRecentActivityTimeline({ events }: { events: any[] }) {
  return (
    <LopaPanel title="Recent Activity Timeline">
      <div className="space-y-3">
        {events.length ? events.map((event) => (
          <div key={event.id} className="relative rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 pl-10">
            <div className="absolute left-3 top-3 rounded-full border border-blue-400/30 bg-blue-500/15 p-1 text-blue-200"><Clock3 size={13} /></div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-100">{event.title}</div>
                <div className="mt-1 text-xs text-slate-400">{event.description}</div>
                <div className="mt-1 text-[11px] text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'}</div>
              </div>
              <TonePill tone={event.severity === 'Critical' ? 'danger' : 'info'}>{event.event_type ?? 'Event'}</TonePill>
            </div>
          </div>
        )) : <div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-4 text-sm text-slate-400">No LOPA history events have been recorded yet.</div>}
      </div>
    </LopaPanel>
  );
}
