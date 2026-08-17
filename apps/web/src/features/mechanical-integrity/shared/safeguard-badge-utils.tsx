function tone(value?: string) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('overdue') || text.includes('failed') || text.includes('blocked') || text.includes('rejected') || text.includes('bypass') || text.includes('degraded')) return 'border-danger/30 bg-danger/10 text-danger';
  if (text.includes('due') || text.includes('warning') || text.includes('pending') || text.includes('needs') || text.includes('draft')) return 'border-warning/30 bg-warning/10 text-warning';
  if (text.includes('active') || text.includes('passed') || text.includes('approved') || text.includes('ready') || text.includes('linked')) return 'border-success/30 bg-success/10 text-success';
  return 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
}

export function SafeguardBadge({ value, fallback = 'Not set' }: { value?: string | boolean | null | undefined; fallback?: string | undefined }) {
  const label = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || fallback);
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${tone(String(label))}`}>{String(label)}</span>;
}
