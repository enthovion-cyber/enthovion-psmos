import { ImmediateActionStatusBadge } from '../shared/ImmediateActionStatusBadge';
import { TemporaryControlBadge } from '../shared/TemporaryControlBadge';
import { VerificationStatusBadge } from '../shared/VerificationStatusBadge';
import { TabPanel, formatDate } from '../shared/IncidentTabPrimitives';

export function ImmediateActionsRegister({ rows, onView, onEdit, onComplete, onVerify, onRejectVerification, onLinkEvidence, onConvert, onLinkCapa, onCancel, onCreateFollowup, canDelete }: any) {
  return <TabPanel title="Immediate Actions Register">
    {!rows?.length ? <p className="text-xs text-slate-500">No immediate actions captured.</p> : <div className="overflow-auto">
      <table className="w-full min-w-[1320px] text-left text-xs">
        <thead className="text-slate-500"><tr><th className="p-2">Action #</th><th>Action type</th><th>Title</th><th>Description summary</th><th>Owner</th><th>Due</th><th>Status</th><th>Priority</th><th>Related hazard</th><th>Temporary</th><th>Verification required</th><th>Verification</th><th>Evidence</th><th>CAPA</th><th>Created by</th><th>Last updated</th><th>Actions</th></tr></thead>
        <tbody>{rows.map((row: any) => <tr key={row.id} className="border-t border-slate-200 align-top dark:border-cyan-300/10">
          <td className="p-2 font-bold">{row.action_number ?? '-'}</td>
          <td>{row.action_type ?? row.category ?? '-'}</td>
          <td className="max-w-[180px] font-bold">{row.title ?? row.action_label}</td>
          <td className="max-w-[240px] text-slate-500">{row.description ?? row.notes ?? '-'}</td>
          <td>{row.owner_id ?? row.temporary_control_owner_id ?? '-'}</td>
          <td>{formatDate(row.due_at)}</td>
          <td><ImmediateActionStatusBadge value={row.status ?? (row.completed ? 'Completed' : 'Open')} /></td>
          <td>{row.priority ?? '-'}</td>
          <td>{row.related_hazard ?? '-'}</td>
          <td><TemporaryControlBadge value={row.temporary_control || row.temporary_control_added} /></td>
          <td>{row.verification_required ? 'Yes' : 'No'}</td>
          <td><VerificationStatusBadge value={row.verified ?? row.verification_status} /></td>
          <td>{row.evidence_count ?? row.linked_evidence_ids?.length ?? 0}</td>
          <td>{row.capa_action_id || row.linked_capa_action_id ? 'Yes' : row.capa_required ? 'Needed' : 'No'}</td>
          <td>{row.created_by ?? '-'}</td>
          <td>{formatDate(row.updated_at)}</td>
          <td><div className="flex min-w-[260px] flex-wrap gap-2">
            <ActionButton label="View" onClick={() => onView(row)} />
            <ActionButton label="Edit" onClick={() => onEdit(row)} />
            <ActionButton label="Complete" onClick={() => onComplete(row.id)} />
            <ActionButton label="Verify" onClick={() => onVerify(row.id)} />
            <ActionButton label="Reject" onClick={() => onRejectVerification(row.id)} />
            <ActionButton label="Evidence" onClick={() => onLinkEvidence(row.id)} />
            <ActionButton label="Convert CAPA" onClick={() => onConvert(row.id)} />
            <ActionButton label="Link CAPA" onClick={() => onLinkCapa(row.id)} />
            <ActionButton label="Follow-up" onClick={() => onCreateFollowup(row.id)} />
            {canDelete ? <ActionButton label="Cancel" danger onClick={() => onCancel(row.id)} /> : null}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </TabPanel>;
}

function ActionButton({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return <button className={`rounded-md px-2 py-1 font-bold ${danger ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-700 dark:text-blue-200'}`} onClick={onClick}>{label}</button>;
}
