export function DataPanel({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title.replace(/([A-Z])/g, ' $1')}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Object.entries(data).map(([key, value]) => <Fact key={key} label={key} value={value} />)}
      </div>
    </section>
  );
}

export function Fact({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] p-3">
      <div className="text-xs text-[var(--psm-muted)]">{label.replace(/([A-Z])/g, ' $1')}</div>
      <div className="mt-1 break-words text-sm font-semibold">{formatValue(value)}</div>
    </div>
  );
}

export function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.code ?? record.id ?? JSON.stringify(record));
  }
  return String(value);
}
