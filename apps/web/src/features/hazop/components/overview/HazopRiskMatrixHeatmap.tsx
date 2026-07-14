'use client';

import type { HazopOverviewRiskCell } from '../../types/hazop-overview.types';

export function HazopRiskMatrixHeatmap({ severityLevels, likelihoodLevels, cells, onCellClick }: { severityLevels: number[]; likelihoodLevels: number[]; cells: HazopOverviewRiskCell[]; onCellClick?: (cell: HazopOverviewRiskCell) => void }) {
  const likelihood = [...(likelihoodLevels.length ? likelihoodLevels : [1, 2, 3, 4, 5])].sort((a, b) => b - a);
  const severity = [...(severityLevels.length ? severityLevels : [1, 2, 3, 4, 5])].sort((a, b) => a - b);
  const cellFor = (l: number, s: number) => cells.find((cell) => cell.likelihood === l && cell.severity === s) ?? { likelihood: l, severity: s, count: 0, level: 'Low', color: '#22c55e' };
  return (
    <div className="grid grid-cols-[28px_1fr] gap-2">
      <div className="flex items-center justify-center text-[10px] uppercase text-[var(--psm-muted)] [writing-mode:vertical-rl]">Likelihood</div>
      <div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${severity.length}, minmax(34px, 1fr))` }}>
          {likelihood.flatMap((l) => severity.map((s) => {
            const cell = cellFor(l, s);
            return (
              <button key={`${l}-${s}`} onClick={() => onCellClick?.(cell)} className="aspect-square rounded-md border border-white/10 text-xs font-semibold text-white shadow-inner transition hover:scale-[1.03]" style={{ backgroundColor: cell.color }}>
                {cell.count || ''}
              </button>
            );
          }))}
        </div>
        <div className="mt-2 grid text-center text-[10px] text-[var(--psm-muted)]" style={{ gridTemplateColumns: `repeat(${severity.length}, minmax(34px, 1fr))` }}>
          {severity.map((s) => <span key={s}>{s}</span>)}
        </div>
        <div className="mt-1 text-center text-[10px] uppercase text-[var(--psm-muted)]">Consequence</div>
      </div>
    </div>
  );
}
