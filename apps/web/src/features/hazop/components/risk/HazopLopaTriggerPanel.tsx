import { ShieldAlert } from 'lucide-react';
import { HazopRiskBadge, HazopRiskEmptyLine, HazopRiskPanel } from './HazopRiskBadge';

export function HazopLopaTriggerPanel({ rows, canMark, canClear, onClear }: any) {
  return (
    <HazopRiskPanel title="LOPA Trigger Panel" icon={ShieldAlert}>
      {rows.slice(0, 6).map((row: any) => (
        <div key={row.id} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <div className="flex items-center justify-between"><span className="font-semibold">{row.scenario_number}</span><HazopRiskBadge value={row.risk_level} /></div>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">{row.lopa_trigger_reason ?? 'LOPA required by policy'}</p>
          {canClear ? <button onClick={() => onClear(row)} className="mt-2 text-xs font-semibold text-primary">Clear after review</button> : null}
        </div>
      ))}
      {!rows.length ? <HazopRiskEmptyLine text="No active LOPA triggers." /> : null}
      {canMark ? <div className="text-xs text-[var(--psm-muted)]">Manual LOPA marking is available through bulk selection or scenario actions.</div> : null}
    </HazopRiskPanel>
  );
}
