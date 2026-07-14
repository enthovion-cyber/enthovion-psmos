export function HazopLopaRequiredBadge({ required }: { required?: boolean }) {
  return required ? (
    <span className="rounded border border-purple-400/25 bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-200">Yes</span>
  ) : (
    <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-400">No</span>
  );
}
