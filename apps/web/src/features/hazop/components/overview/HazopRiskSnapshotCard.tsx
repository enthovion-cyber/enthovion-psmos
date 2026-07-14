'use client';

import { HazopRiskMatrixHeatmap } from './HazopRiskMatrixHeatmap';

export function HazopRiskSnapshotCard({ riskSnapshot, onNavigate }: { riskSnapshot: any; onNavigate: (tab?: string) => void }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">3. Risk Snapshot</h3>
        <button onClick={() => onNavigate('Risk Ranking')} className="text-xs font-semibold text-primary">Open risk ranking</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_150px]">
        <HazopRiskMatrixHeatmap severityLevels={riskSnapshot.severityLevels ?? []} likelihoodLevels={riskSnapshot.likelihoodLevels ?? []} cells={riskSnapshot.cells ?? []} onCellClick={() => onNavigate('Risk Ranking')} />
        <div className="space-y-3">
          {(riskSnapshot.legend ?? []).map((item: any) => (
            <div key={item.level} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.level}</span>
              <span className="font-semibold">{item.count}</span>
            </div>
          ))}
          <div className="border-t border-[var(--psm-line)] pt-3 text-xs text-[var(--psm-muted)]">
            <div>Total scenarios: <span className="font-semibold text-[var(--psm-text)]">{riskSnapshot.totalScenarios ?? 0}</span></div>
            <div>High/Critical: <span className="font-semibold text-red-300">{riskSnapshot.highCriticalTotal ?? 0}</span></div>
            <div>Unranked: <span className="font-semibold text-amber-300">{riskSnapshot.unrankedScenarios ?? 0}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
