function tone(value?: string | null) {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('block') || text.includes('critical') || text.includes('out of sync') || text.includes('failed')) return 'border-danger/30 bg-danger/10 text-danger';
  if (text.includes('wait') || text.includes('pending') || text.includes('review') || text.includes('required') || text.includes('sync')) return 'border-warning/30 bg-warning/10 text-warning';
  if (text.includes('ready') || text.includes('verified') || text.includes('closed') || text.includes('approved') || text.includes('resolved') || text.includes('in sync')) return 'border-success/30 bg-success/10 text-success';
  return 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
}

export function PsiIntegrationBadge({ value, fallback = 'Not set' }: { value?: string | null | undefined; fallback?: string | undefined }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone(value)}`}>{value || fallback}</span>;
}
