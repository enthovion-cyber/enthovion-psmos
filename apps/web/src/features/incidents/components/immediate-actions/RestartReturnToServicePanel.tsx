import { InfoRows, TabPanel, formatDate } from '../shared/IncidentTabPrimitives';

export function RestartReturnToServicePanel({ data }: any) {
  const latest = data?.rows?.[0] ?? {};
  return <TabPanel title="Restart / Return-to-Service Control">
    <div className="grid gap-3">
      {data?.restartBlocked ? <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2 text-xs font-bold text-amber-700 dark:text-amber-200">Restart is blocked until required approvals, inspections, and follow-up actions are resolved.</div> : null}
      <InfoRows rows={[
        ['Restart blocked', data?.restartBlocked ? 'Yes' : 'No'],
        ['Restart block reason', latest.blocked_reason ?? data?.blockers?.[0]?.reason],
        ['Equipment/unit/process affected', latest.equipment_unit_process_affected],
        ['Return-to-service allowed', latest.return_to_service_allowed],
        ['Required before restart', latest.required_before_restart],
        ['PSSR required', latest.pssr_required ? 'Yes' : 'No'],
        ['MOC required', latest.moc_required ? 'Yes' : 'No'],
        ['Inspection required', latest.inspection_required ? 'Yes' : 'No'],
        ['MI signoff required', latest.mi_required ? 'Yes' : 'No'],
        ['HSE signoff required', latest.hse_signoff_required ? 'Yes' : 'No'],
        ['Operations signoff required', latest.operations_signoff_required ? 'Yes' : 'No'],
        ['Approval status', latest.approval_status],
        ['Approved by', latest.approved_by],
        ['Approved at', formatDate(latest.approved_at)],
        ['Evidence links', latest.evidence_links?.join(', ')],
        ['Notes', latest.notes]
      ]} />
      <div className="grid gap-2">{(data?.blockers ?? []).map((blocker: any) => <div key={`${blocker.title}-${blocker.reason}`} className="rounded-lg border border-red-400/25 bg-red-500/10 p-2 text-xs text-red-700 dark:text-red-200"><b>{blocker.title}</b><div>{blocker.reason}</div></div>)}</div>
    </div>
  </TabPanel>;
}
