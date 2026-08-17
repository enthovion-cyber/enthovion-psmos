export function DesignBasisCompletenessBadge({ value, score }: { value?: string | null; score?: number | null }) {
  const tone = value === 'Complete' ? 'border-success/40 bg-success/10 text-success' : value === 'Critical Gaps' ? 'border-danger/40 bg-danger/10 text-danger' : 'border-warning/40 bg-warning/10 text-warning';
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{value ?? 'Not Reviewed'}{score !== null && score !== undefined ? ` (${score}%)` : ''}</span>;
}
