'use client';

export function TechnicalDataRevisionHistory({ revisions }: { revisions: Array<Record<string, unknown>> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h3 className="font-bold text-[var(--psm-text)]">Technical Data Change History</h3>
      {!revisions.length ? <p className="mt-3 text-sm text-[var(--psm-muted)]">No technical data revisions recorded yet.</p> : (
        <div className="mt-4 space-y-3">
          {revisions.map((revision) => (
            <div key={String(revision.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-[var(--psm-text)]">Revision {String(revision.revision_number ?? '-')}</strong>
                <span className="text-xs text-[var(--psm-muted)]">{String(revision.created_at ?? '')}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">{String(revision.change_reason ?? 'Technical data changed')}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
