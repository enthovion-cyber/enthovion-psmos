'use client';

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-muted-bg)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--psm-muted)]">{label}</p>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs text-[var(--psm-text)]">{JSON.stringify(value ?? {}, null, 2)}</pre>
    </div>
  );
}

export function BeforeAfterChangePanel({ before, after }: { before: unknown; after: unknown }) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <JsonBlock label="Before" value={before} />
      <JsonBlock label="After" value={after} />
    </section>
  );
}
