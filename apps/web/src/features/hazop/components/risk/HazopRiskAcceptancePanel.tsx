import { FileCheck2 } from 'lucide-react';
import { HazopRiskEmptyLine, HazopRiskMiniButton, HazopRiskPanel, HazopRiskStatusBadge } from './HazopRiskBadge';

export function HazopRiskAcceptancePanel({ rows, canApprove, onApprove, onReject }: any) {
  return (
    <HazopRiskPanel title="Risk Acceptance" icon={FileCheck2}>
      {rows.slice(0, 5).map((row: any) => (
        <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold">{row.acceptance_type}</span><HazopRiskStatusBadge tone={row.status === 'Approved' ? 'green' : row.status === 'Rejected' ? 'red' : 'amber'}>{row.status}</HazopRiskStatusBadge></div>
          <p className="mt-2 line-clamp-2 text-xs text-[var(--psm-muted)]">{row.justification}</p>
          {row.expiry_date ? <div className="mt-2 text-xs text-amber-300">Expires {row.expiry_date}</div> : null}
          {canApprove && ['Requested', 'Pending Approval'].includes(row.status) ? <div className="mt-3 flex gap-2"><HazopRiskMiniButton onClick={() => onApprove(row)}>Approve</HazopRiskMiniButton><HazopRiskMiniButton onClick={() => onReject(row)}>Reject</HazopRiskMiniButton></div> : null}
        </div>
      ))}
      {!rows.length ? <HazopRiskEmptyLine text="No risk acceptances requested." /> : null}
    </HazopRiskPanel>
  );
}
