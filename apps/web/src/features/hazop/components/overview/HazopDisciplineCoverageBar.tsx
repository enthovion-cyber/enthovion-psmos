'use client';

export function HazopDisciplineCoverageBar({ covered = 0, partial = 0, missing = 0 }: { covered?: number; partial?: number; missing?: number }) {
  const total = Math.max(covered + partial + missing, 1);
  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
        <div className="bg-emerald-400" style={{ width: `${(covered / total) * 100}%` }} />
        <div className="bg-amber-400" style={{ width: `${(partial / total) * 100}%` }} />
        <div className="bg-red-400" style={{ width: `${(missing / total) * 100}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--psm-muted)]">
        <span className="text-emerald-300">Covered {covered}</span>
        <span className="text-amber-300">Partial {partial}</span>
        <span className="text-red-300">Missing {missing}</span>
      </div>
    </div>
  );
}
