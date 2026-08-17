export function RatingSuitabilityBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Needs Review';
  const tone = text === 'Suitable' ? 'border-success/30 bg-success/10 text-success' : text.includes('Mismatch') || text.includes('Missing') ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning/30 bg-warning/10 text-warning';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
