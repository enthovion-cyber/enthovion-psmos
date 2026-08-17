export function DesignBasisConflictBadge({ value }: { value?: string | null }) {
  const tone = value === 'Critical Conflict' ? 'border-danger/40 bg-danger/10 text-danger' : value === 'Major Conflict' || value === 'Warning' ? 'border-warning/40 bg-warning/10 text-warning' : value === 'No Conflict' ? 'border-success/40 bg-success/10 text-success' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{value ?? 'Not Reviewed'}</span>;
}
