import { ESignatureStatusBadge } from '../shared/ESignatureStatusBadge';
import { Badge } from '../shared/IncidentStatusBadge';
import { buttonSecondary, formatDate, TabPanel } from '../shared/IncidentTabPrimitives';

export function ReviewersApproversRegister({ rows, onEdit, onRequest, onApprove, onReject, onRequestChanges, onDelegate, onEscalate, onSign, onRemove }: any) {
  return (
    <TabPanel title="Reviewer & Approver Register">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left text-xs">
          <thead className="text-slate-500"><tr>{['Name','Role','Level','Required','Status','Decision','Due date','Signature','Escalation','Actions'].map((head) => <th key={head} className="border-b border-slate-200 px-2 py-2 dark:border-cyan-300/10">{head}</th>)}</tr></thead>
          <tbody>
            {(rows ?? []).map((row: any) => (
              <tr key={row.id} className="align-top">
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10"><b>{row.reviewer_name ?? row.name ?? row.reviewer_user_id}</b><div className="text-slate-500">{row.reviewer_email ?? row.email}</div><div className="text-slate-400">{row.department}</div></td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10">{row.role}</td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10">{row.approval_level ?? '-'}</td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10"><Badge value={!!row.required} /></td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10"><Badge value={row.status} /></td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10"><Badge value={row.decision ?? 'Pending'} /></td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10">{formatDate(row.due_date ?? row.dueDate)}</td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10"><ESignatureStatusBadge value={row.e_signature_id ? 'Signed' : row.signature_status} required={row.e_signature_required} /></td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10"><Badge value={row.escalation_status ?? 'None'} /></td>
                <td className="border-b border-slate-100 px-2 py-2 dark:border-cyan-300/10">
                  <div className="flex flex-wrap gap-1">
                    <button className={buttonSecondary} onClick={() => onEdit(row)}>Edit</button>
                    <button className={buttonSecondary} onClick={() => onRequest(row)}>Request</button>
                    <button className={buttonSecondary} onClick={() => onApprove(row)}>Approve</button>
                    <button className={buttonSecondary} onClick={() => onReject(row)}>Reject</button>
                    <button className={buttonSecondary} onClick={() => onRequestChanges(row)}>Changes</button>
                    <button className={buttonSecondary} onClick={() => onSign(row)}>E-Sign</button>
                    <button className={buttonSecondary} onClick={() => onDelegate(row)}>Delegate</button>
                    <button className={buttonSecondary} onClick={() => onEscalate(row)}>Escalate</button>
                    <button className={buttonSecondary} onClick={() => onRemove(row)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!(rows ?? []).length ? <p className="py-3 text-xs text-slate-500">No reviewers or approvers configured.</p> : null}
      </div>
    </TabPanel>
  );
}
