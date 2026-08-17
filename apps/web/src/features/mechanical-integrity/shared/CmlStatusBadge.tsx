export function CmlStatusBadge({ value }: { value?: string | null | undefined }) {
  const text = value ?? 'Not set';
  const tone = /archived|inactive/i.test(text) ? 'bg-neutral/10 text-[var(--psm-muted)]' : /overdue|below|critical|error/i.test(text) ? 'bg-danger/10 text-danger' : /warning|attention|low|high|no calculation/i.test(text) ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{text}</span>;
}
