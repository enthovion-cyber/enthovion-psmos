'use client';
import { EmptyState, PSSRCard } from '../pssr-ui';
export function PSSRBeforeAfterViewer({ event }: { event?: any }) {
  return <PSSRCard title="Before / After Viewer">{event ? <div className="grid gap-3 lg:grid-cols-2"><pre className="max-h-72 overflow-auto rounded-lg bg-slate-950/60 p-3 text-xs text-slate-300">{JSON.stringify(event.before_value ?? {}, null, 2)}</pre><pre className="max-h-72 overflow-auto rounded-lg bg-slate-950/60 p-3 text-xs text-slate-300">{JSON.stringify(event.after_value ?? {}, null, 2)}</pre></div> : <EmptyState title="No event selected" />}</PSSRCard>;
}
