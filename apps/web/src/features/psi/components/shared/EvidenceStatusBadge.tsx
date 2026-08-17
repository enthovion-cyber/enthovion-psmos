export function EvidenceStatusBadge({ value }: { value?: string | null | undefined }) {
  const label = value ? 'Evidence Found' : 'Missing Evidence';
  const tone = value ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}
