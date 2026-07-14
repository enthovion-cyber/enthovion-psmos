'use client';

import type { IplRegistryHistoryEvent } from '../../types/lopa-ipl-registry.types';

export function IplRegistryHistoryPanel({ history }: { history?: IplRegistryHistoryEvent[] | undefined }) {
  const rows = history ?? [];
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#03101d] p-4">
      <h3 className="text-sm font-black text-white">Registry History</h3>
      <div className="mt-3 space-y-3">
        {rows.length ? rows.map((event) => (
          <div key={event.id} className="border-l border-blue-400/40 pl-3">
            <div className="text-sm font-bold text-slate-100">{event.title}</div>
            <div className="text-xs text-slate-500">{event.event_type} · {new Date(event.created_at).toLocaleString()}</div>
            {event.description ? <p className="mt-1 text-xs text-slate-400">{event.description}</p> : null}
          </div>
        )) : <div className="rounded-lg border border-cyan-300/10 bg-[#071525] p-3 text-sm text-slate-400">No history events yet.</div>}
      </div>
    </section>
  );
}
