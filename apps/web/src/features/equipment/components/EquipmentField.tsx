export function EquipmentField({ label, value }: { label: string; value?: string | number | boolean | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--psm-muted)]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--psm-text)]">{value ?? 'Not specified'}</div>
    </div>
  );
}
