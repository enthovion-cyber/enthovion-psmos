import { History } from 'lucide-react';
import { HazopRiskEmptyLine, HazopRiskPanel } from './HazopRiskBadge';

export function HazopRiskHistoryPanel({ rows }: { rows: any[] }) {
  return (
    <HazopRiskPanel title="Risk History" icon={History}>
      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {rows.slice(0, 12).map((row) => <div key={row.id} className="border-l border-primary/40 pl-3 text-sm"><div className="font-semibold">{row.change_type}</div><div className="text-xs text-[var(--psm-muted)]">{row.reason ?? 'No reason captured'}</div><div className="text-[11px] text-[var(--psm-muted)]">{new Date(row.created_at).toLocaleString()}</div></div>)}
        {!rows.length ? <HazopRiskEmptyLine text="No risk changes recorded yet." /> : null}
      </div>
    </HazopRiskPanel>
  );
}
