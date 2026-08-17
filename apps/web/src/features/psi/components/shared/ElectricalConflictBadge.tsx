export function ElectricalConflictBadge({ value }: { value?: string | null | undefined }) {
  const text = value || 'Not Checked';
  const tone = text.includes('No') || text === 'Clear' ? 'border-success/30 bg-success/10 text-success' : text.includes('Critical') || text.includes('Conflict') ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning/30 bg-warning/10 text-warning';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
