export function ReliefScenarioBadge({ value }: { value?: string | null | undefined }) {
  return <span className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-1 text-xs font-semibold">{value || 'Scenario missing'}</span>;
}
