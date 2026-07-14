import { formatDate, TabPanel } from '../shared/IncidentTabPrimitives';
import { TemporaryControlBadge } from '../shared/TemporaryControlBadge';

export function TemporaryControlsPanel({ data }: any) {
  const rows = data?.rows ?? [];
  return <TabPanel title="Temporary Controls">
    <div className="grid gap-3">
      {data?.expired?.length ? <div className="rounded-lg border border-red-400/25 bg-red-500/10 p-2 text-xs font-bold text-red-700 dark:text-red-200">Expired temporary controls require immediate review or conversion to permanent action.</div> : null}
      {!rows.length ? <p className="text-xs text-slate-500">No temporary controls captured.</p> : rows.map((row: any) => <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
        <div className="flex flex-wrap items-center gap-2"><b>{row.title ?? row.action_label}</b><TemporaryControlBadge value /></div>
        <div className="mt-2 grid gap-1 text-slate-500">
          <div>Type: <b>{row.temporary_control_type ?? '-'}</b></div>
          <div>Description: <b>{row.temporary_control_description ?? row.description ?? '-'}</b></div>
          <div>Owner: <b>{row.temporary_control_owner_id ?? row.owner_id ?? '-'}</b></div>
          <div>Start: <b>{formatDate(row.temporary_control_start_at)}</b> · Expiry: <b>{formatDate(row.temporary_control_expiry_at ?? row.temporary_control_expiry)}</b></div>
          <div>Review frequency: <b>{row.review_frequency ?? '-'}</b> · Next verification: <b>{formatDate(row.next_verification_due_at)}</b></div>
          <div>Permanent action required: <b>{row.replacement_permanent_action_required ? 'Yes' : 'No'}</b> · Linked CAPA/action: <b>{row.linked_capa_action_id ?? row.capa_action_id ?? '-'}</b></div>
        </div>
      </div>)}
    </div>
  </TabPanel>;
}
