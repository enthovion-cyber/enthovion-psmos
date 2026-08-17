export function ElectricalClassificationBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Not Classified';
  const tone = text === 'Approved' || text === 'Current' ? 'border-success/30 bg-success/10 text-success' : text.includes('Missing') || text.includes('Conflict') ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning/30 bg-warning/10 text-warning';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
