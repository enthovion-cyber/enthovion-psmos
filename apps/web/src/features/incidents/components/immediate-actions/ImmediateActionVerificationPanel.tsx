import { formatDate, TabPanel } from '../shared/IncidentTabPrimitives';
import { VerificationStatusBadge } from '../shared/VerificationStatusBadge';

export function ImmediateActionVerificationPanel({ data }: any) {
  const rows = data?.rows ?? [];
  return <TabPanel title="Immediate Action Verification">
    <div className="grid gap-3">
      {data?.failed?.length ? <div className="rounded-lg border border-red-400/25 bg-red-500/10 p-2 text-xs font-bold text-red-700 dark:text-red-200">One or more verifications failed and require rework.</div> : null}
      {!rows.length ? <p className="text-xs text-slate-500">No verification records pending.</p> : rows.map((row: any) => <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
        <div className="flex flex-wrap items-center gap-2"><b>{row.title ?? row.action_label}</b><VerificationStatusBadge value={row.verified ?? row.verification_status} /></div>
        <div className="mt-2 grid gap-1 text-slate-500">
          <div>Verification required: <b>{row.verification_required ? 'Yes' : 'No'}</b></div>
          <div>Criteria: <b>{row.verification_criteria ?? '-'}</b></div>
          <div>Method: <b>{row.verification_method ?? '-'}</b></div>
          <div>Verified by: <b>{row.verified_by ?? row.last_verified_by ?? '-'}</b> · Verified at: <b>{formatDate(row.verified_at ?? row.last_verified_at)}</b></div>
          <div>Evidence: <b>{row.verification_evidence ?? row.evidence_id ?? '-'}</b></div>
          <div>Failed reason: <b>{row.failed_verification_reason ?? '-'}</b> · Rework required: <b>{row.rework_required ? 'Yes' : 'No'}</b></div>
          <div>Notes: <b>{row.verification_notes ?? row.notes ?? '-'}</b></div>
        </div>
      </div>)}
    </div>
  </TabPanel>;
}
