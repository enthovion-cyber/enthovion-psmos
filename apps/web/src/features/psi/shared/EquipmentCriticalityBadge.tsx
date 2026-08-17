export function EquipmentCriticalityBadge({ value }: { value?: string | null }) {
  const tone = value === 'Critical' ? 'border-danger/40 bg-danger/10 text-danger' : value === 'High' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>{value ?? 'Not set'}</span>;
}
