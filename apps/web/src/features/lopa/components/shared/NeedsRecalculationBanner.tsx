export function NeedsRecalculationBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-semibold text-amber-100">Inputs changed after the latest calculation. Recalculate before using this result for SIL or review decisions.</div>;
}
