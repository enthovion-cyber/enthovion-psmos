export function ImpairmentRiskBadge({ risk }: { risk?: string | null | undefined }) {
  const value = risk || 'Not assessed';
  const tone = /critical/i.test(value) ? 'border-danger/40 bg-danger/10 text-danger' : /high/i.test(value) ? 'border-warning/40 bg-warning/10 text-warning' : /medium/i.test(value) ? 'border-info/30 bg-info/10 text-info' : 'border-success/30 bg-success/10 text-success';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
