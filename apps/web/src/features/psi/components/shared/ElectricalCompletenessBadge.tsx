export function ElectricalCompletenessBadge({ value, score }: { value?: string | null | undefined; score?: number | null | undefined }) {
  const text = `${value || 'Not Checked'}${typeof score === 'number' ? ` (${score}%)` : ''}`;
  const tone = value === 'Complete' ? 'border-success/30 bg-success/10 text-success' : value?.includes('Missing') || value?.includes('Incomplete') ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning/30 bg-warning/10 text-warning';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
