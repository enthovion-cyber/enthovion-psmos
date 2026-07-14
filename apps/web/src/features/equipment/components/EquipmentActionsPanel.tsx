'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileUp, ShieldAlert } from 'lucide-react';
import type { EquipmentAction } from '@/services/equipment.service';

type Filter = 'all' | 'open' | 'overdue' | 'safety-critical' | 'closed';

function badgeClass(value: string) {
  if (value === 'SAFETY_CRITICAL' || value === 'HIGH') return 'border-danger/40 bg-danger/10 text-danger';
  if (value === 'MEDIUM' || value === 'PENDING_VERIFICATION') return 'border-warning/40 bg-warning/10 text-warning';
  if (value === 'CLOSED') return 'border-success/40 bg-success/10 text-success';
  return 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-text)]';
}

function isOverdue(action: EquipmentAction) {
  return !['CLOSED', 'CANCELLED'].includes(action.status) && new Date(action.dueDate).getTime() < Date.now();
}

export function EquipmentActionsPanel({
  actions,
  onUpdateStatus,
  onUploadEvidence
}: {
  actions: EquipmentAction[];
  onUpdateStatus: (actionId: string, status: EquipmentAction['status']) => void;
  onUploadEvidence: (actionId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = useMemo(() => actions.filter((action) => {
    if (filter === 'open') return !['CLOSED', 'CANCELLED'].includes(action.status);
    if (filter === 'overdue') return isOverdue(action);
    if (filter === 'safety-critical') return action.priority === 'SAFETY_CRITICAL';
    if (filter === 'closed') return action.status === 'CLOSED';
    return true;
  }), [actions, filter]);

  const filters: Array<[Filter, string, number]> = [
    ['all', 'All', actions.length],
    ['open', 'Open', actions.filter((action) => !['CLOSED', 'CANCELLED'].includes(action.status)).length],
    ['overdue', 'Overdue', actions.filter(isOverdue).length],
    ['safety-critical', 'Safety-Critical', actions.filter((action) => action.priority === 'SAFETY_CRITICAL').length],
    ['closed', 'Closed', actions.filter((action) => action.status === 'CLOSED').length]
  ];

  return (
    <div className="psm-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide">Actions Register</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Open, overdue, evidence, and closure actions linked to this equipment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(([key, label, count]) => (
            <button key={key} onClick={() => setFilter(key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${filter === key ? 'border-info bg-info/10 text-info' : 'border-[var(--psm-line)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)]'}`}>
              {label} <span className="ml-1 text-[var(--psm-text)]">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No actions match this view.</div>
      ) : (
        <div className="overflow-auto rounded-lg border border-[var(--psm-line)]">
          <table className="psm-table w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
              <tr>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Priority</th>
                <th className="px-3 py-3">Owner</th>
                <th className="px-3 py-3">Due Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Controls</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((action) => (
                <tr key={action.id} className="border-t border-[var(--psm-line)] align-top hover:bg-[var(--psm-surface-2)]">
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      {action.priority === 'SAFETY_CRITICAL' ? <ShieldAlert size={17} className="mt-0.5 text-danger" /> : isOverdue(action) ? <AlertTriangle size={17} className="mt-0.5 text-warning" /> : <CheckCircle2 size={17} className="mt-0.5 text-success" />}
                      <div>
                        <div className="font-medium text-[var(--psm-text)]">{action.title}</div>
                        <div className="mt-1 max-w-xl text-xs leading-5 text-[var(--psm-muted)]">{action.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><span className={`rounded border px-2 py-1 text-xs ${badgeClass(action.priority)}`}>{action.priority.replace('_', ' ')}</span></td>
                  <td className="px-3 py-3 text-[var(--psm-text)]">
                    {action.assignedTo?.displayName ?? 'Unassigned'}
                    <div className="text-xs text-[var(--psm-muted)]">{action.assignedTo?.department ?? action.assignedTo?.title ?? ''}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={isOverdue(action) ? 'text-danger' : 'text-[var(--psm-text)]'}>{new Date(action.dueDate).toLocaleDateString()}</div>
                    {isOverdue(action) ? <div className="text-xs text-danger">Overdue</div> : <div className="flex items-center gap-1 text-xs text-[var(--psm-muted)]"><Clock size={12} /> On schedule</div>}
                  </td>
                  <td className="px-3 py-3"><span className={`rounded border px-2 py-1 text-xs ${badgeClass(action.status)}`}>{action.status.replace('_', ' ')}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <select
                        value={action.status}
                        onChange={(event) => onUpdateStatus(action.id, event.target.value as EquipmentAction['status'])}
                        className="psm-input px-2 py-1 text-xs text-info"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="PENDING_VERIFICATION">Pending Verification</option>
                        <option value="CLOSED">Closed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <button onClick={() => onUploadEvidence(action.id)} className="inline-flex items-center gap-1 rounded-md border border-[var(--psm-line)] px-2 py-1 text-xs text-[var(--psm-text)] hover:bg-[var(--psm-surface-3)]"><FileUp size={12} /> Evidence</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
