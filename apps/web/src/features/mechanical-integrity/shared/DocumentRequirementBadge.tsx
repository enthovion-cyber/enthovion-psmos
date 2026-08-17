export function DocumentRequirementBadge({ required }: { required?: boolean | null }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${required ? 'border-warning/30 bg-warning/10 text-warning' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>{required ? 'Required' : 'Optional'}</span>;
}
