import { AlertTriangle } from 'lucide-react';
import { HazopRiskBadge, HazopRiskEmptyLine, HazopRiskPanel } from './HazopRiskBadge';

export function HazopHighCriticalRiskPanel({ rows, onOpen }: { rows: any[]; onOpen: (row: any) => void }) {
  return (
    <HazopRiskPanel title="High / Critical Risk" icon={AlertTriangle}>
      {rows.slice(0, 6).map((row) => (
        <button key={row.id} onClick={() => onOpen(row)} className="w-full rounded-lg border border-[var(--psm-line)] p-3 text-left hover:bg-[var(--psm-surface-2)]">
          <div className="flex items-center justify-between"><span className="font-semibold">{row.scenario_number}</span><HazopRiskBadge value={row.risk_level} /></div>
          <p className="mt-2 line-clamp-2 text-xs text-[var(--psm-muted)]">{row.consequence}</p>
        </button>
      ))}
      {!rows.length ? <HazopRiskEmptyLine text="No open high or critical risks." /> : null}
    </HazopRiskPanel>
  );
}
