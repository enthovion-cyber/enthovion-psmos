export function TemperatureClassBadge({ value }: { value?: string | null | undefined }) {
  return <span className="inline-flex rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">{value || 'T-class Missing'}</span>;
}
