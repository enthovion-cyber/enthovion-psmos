import { Scale } from 'lucide-react';
import { HazopRiskBadge, HazopRiskEmptyLine, HazopRiskPanel } from './HazopRiskBadge';

export function HazopResidualRiskPanel({ rows, onOpen }: { rows: any[]; onOpen: (row: any) => void }) {
  const residualRows = rows.filter((row) => row.residual_risk_level);
  return (
    <HazopRiskPanel title="Residual Risk" icon={Scale}>
      {residualRows.slice(0, 5).map((row) => (
        <button key={row.id} onClick={() => onOpen(row)} className="w-full rounded-lg border border-[var(--psm-line)] p-3 text-left hover:bg-[var(--psm-surface-2)]">
          <div className="flex items-center justify-between"><span className="font-semibold">{row.scenario_number}</span><HazopRiskBadge value={row.residual_risk_level} /></div>
          <div className="mt-2 text-xs text-[var(--psm-muted)]">Residual score {row.residual_risk_score ?? '-'} after safeguards / controls</div>
        </button>
      ))}
      {!residualRows.length ? <HazopRiskEmptyLine text="No residual risk rankings captured yet." /> : null}
    </HazopRiskPanel>
  );
}
