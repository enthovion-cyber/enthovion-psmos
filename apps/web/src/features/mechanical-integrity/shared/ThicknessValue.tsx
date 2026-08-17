export function ThicknessValue({ value, unit = 'mm' }: { value?: string | number | null | undefined; unit?: string | null | undefined }) {
  if (value === undefined || value === null || value === '') return <span className="text-[var(--psm-muted)]">Not recorded</span>;
  return <span className="font-semibold text-[var(--psm-text)]">{String(value)} {unit ?? 'mm'}</span>;
}
