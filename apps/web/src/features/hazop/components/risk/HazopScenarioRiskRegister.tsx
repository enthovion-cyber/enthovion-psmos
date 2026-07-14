import { RefreshCw } from 'lucide-react';
import { HazopRiskBadge, HazopRiskMiniButton, HazopRiskStateCard, HazopRiskStatusBadge } from './HazopRiskBadge';

export function HazopScenarioRiskRegister({
  rows,
  loading,
  canEdit,
  canRecalculate,
  canAccept,
  onOpen,
  onEdit,
  onAccept,
  onRecalculate,
  selectedIds,
  onSelectionChange
}: any) {
  if (loading) return <HazopRiskStateCard title="Loading risk register" text="Fetching backend-calculated scenario risks..." />;
  if (!rows.length) return <HazopRiskStateCard title="No matching scenarios" text="No scenario risk records match the current filters." />;

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4"><h3 className="font-semibold">Scenario Risk Register</h3><span className="text-sm text-[var(--psm-muted)]">{rows.length} rows</span></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="sticky top-0 bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="px-3 py-3 text-left"><input type="checkbox" checked={rows.length > 0 && selectedIds.length === rows.length} onChange={(event) => onSelectionChange(event.target.checked ? rows.map((row: any) => row.id) : [])} /></th>
              {['Scenario', 'Node', 'Deviation', 'Cause / Consequence', 'Initial Risk', 'Residual Risk', 'LOPA', 'Acceptance', 'Recommendations', 'Status', 'Actions'].map((head) => <th key={head} className="px-3 py-3 text-left">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={(event) => onSelectionChange(event.target.checked ? [...selectedIds, row.id] : selectedIds.filter((id: string) => id !== row.id))} /></td>
                <td className="px-3 py-3"><button onClick={() => onOpen(row)} className="font-semibold text-primary">{row.scenario_number}</button><div className="text-xs text-[var(--psm-muted)]">Row {row.row_number ?? '-'}</div></td>
                <td className="px-3 py-3">{row.node?.node_number ?? '-'}<div className="text-xs text-[var(--psm-muted)]">{row.node?.title ?? 'No node'}</div></td>
                <td className="px-3 py-3">{row.guideword ?? '-'} / {row.parameter ?? '-'}<div className="text-xs text-[var(--psm-muted)]">{row.deviation_text ?? '-'}</div></td>
                <td className="max-w-[280px] px-3 py-3"><div className="line-clamp-1">{row.cause}</div><div className="line-clamp-1 text-xs text-[var(--psm-muted)]">{row.consequence}</div></td>
                <td className="px-3 py-3"><HazopRiskBadge value={row.risk_level} /><div className="mt-1 text-xs text-[var(--psm-muted)]">S{row.severity} x L{row.likelihood} = {row.risk_score}</div></td>
                <td className="px-3 py-3">{row.residual_risk_level ? <HazopRiskBadge value={row.residual_risk_level} /> : <span className="text-[var(--psm-muted)]">Not set</span>}<div className="mt-1 text-xs text-[var(--psm-muted)]">{row.residual_risk_score ? `Score ${row.residual_risk_score}` : 'Residual optional'}</div></td>
                <td className="px-3 py-3">{row.lopa_required ? <HazopRiskStatusBadge tone="red">Required</HazopRiskStatusBadge> : <HazopRiskStatusBadge tone="green">No</HazopRiskStatusBadge>}<div className="mt-1 line-clamp-1 text-xs text-[var(--psm-muted)]">{row.lopa_trigger_reason ?? '-'}</div></td>
                <td className="px-3 py-3"><HazopRiskStatusBadge tone={row.acceptanceStatus === 'Approved' ? 'green' : row.acceptanceStatus === 'Rejected' ? 'red' : row.acceptance_required ? 'amber' : 'slate'}>{row.acceptanceStatus ?? 'Not Required'}</HazopRiskStatusBadge></td>
                <td className="px-3 py-3">{row.recommendationCount ?? 0}<div className="text-xs text-[var(--psm-muted)]">{row.recommendation_required ? 'Required' : 'Optional'}</div></td>
                <td className="px-3 py-3">{row.status}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    {canEdit ? <HazopRiskMiniButton onClick={() => onEdit(row)}>Rank</HazopRiskMiniButton> : null}
                    {canRecalculate ? <HazopRiskMiniButton onClick={() => onRecalculate(row.id)}><RefreshCw size={13} /></HazopRiskMiniButton> : null}
                    {canAccept && (row.acceptance_required || ['High', 'Critical'].includes(row.risk_level)) ? <HazopRiskMiniButton onClick={() => onAccept(row)}>Accept</HazopRiskMiniButton> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
