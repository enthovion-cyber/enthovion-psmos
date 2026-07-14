export function FrequencyDisplay({ value, unit = '/yr' }: { value?: number | string | null | undefined; unit?: string | undefined }) {
  const numeric = Number(value);
  const shown = Number.isFinite(numeric) && numeric !== 0 ? numeric.toExponential(2) : '-';
  return <span className="font-mono text-sm font-bold text-slate-100">{shown} <span className="text-[11px] text-slate-500">{unit}</span></span>;
}
