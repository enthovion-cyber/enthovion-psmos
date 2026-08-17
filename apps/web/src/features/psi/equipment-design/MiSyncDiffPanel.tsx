import { PsiCard, PsiEmptyState } from '../shared/PsiUi';

export function MiSyncDiffPanel({ syncEvents }: { syncEvents: Array<Record<string, unknown>> }) {
  if (!syncEvents.length) return <PsiEmptyState title="No MI sync events" message="No compare-only, MI import, or MI export events have been recorded for this equipment design basis." />;
  return (
    <PsiCard title="MI / Equipment Registry Sync" subtitle="Compare-only is the default. Imported/exported values are captured as sync events with before/after snapshots.">
      <div className="space-y-3">
        {syncEvents.map((event) => (
          <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{String(event.sync_direction ?? event.event_type ?? 'Sync event')}</p>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{String(event.sync_status ?? 'Recorded')}</span>
            </div>
            <p className="mt-1 text-[var(--psm-muted)]">{String(event.summary ?? event.reason ?? 'No summary returned.')}</p>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">{event.created_at ? new Date(String(event.created_at)).toLocaleString() : 'No timestamp'}</p>
          </div>
        ))}
      </div>
    </PsiCard>
  );
}
