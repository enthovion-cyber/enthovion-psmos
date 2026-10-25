'use client';

import { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileUp, 
  Search, 
  ShieldAlert, 
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import type { EquipmentAction } from '@/services/equipment.service';
import { ActionEvidenceModal } from './ActionEvidenceModal';

type Filter = 'all' | 'open' | 'overdue' | 'safety-critical' | 'pre-startup' | 'closed';

function badgeClass(value: string) {
  if (value === 'SAFETY_CRITICAL' || value === 'HIGH') return 'border-danger/40 bg-danger/10 text-danger';
  if (value === 'MEDIUM' || value === 'PENDING_VERIFICATION') return 'border-warning/40 bg-warning/10 text-warning';
  if (value === 'CLOSED') return 'border-success/40 bg-success/10 text-success';
  return 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-text)]';
}

function isOverdue(action: EquipmentAction) {
  return !['CLOSED', 'CANCELLED'].includes(action.status) && new Date(action.dueDate).getTime() < Date.now();
}

function isPreStartup(action: EquipmentAction) {
  return (action as any).timingGate === 'PRE_STARTUP' || /startup|pssr/i.test(action.title);
}

export function EquipmentActionsPanel({
  actions,
  equipmentTag = 'Equipment',
  onUpdateStatus,
  onUploadEvidence
}: {
  actions: EquipmentAction[];
  equipmentTag?: string;
  onUpdateStatus: (actionId: string, status: EquipmentAction['status']) => void;
  onUploadEvidence: (actionId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionForEvidence, setSelectedActionForEvidence] = useState<EquipmentAction | null>(null);

  const preStartupCount = useMemo(() => {
    return actions.filter((a) => !['CLOSED', 'CANCELLED'].includes(a.status) && isPreStartup(a)).length;
  }, [actions]);

  const visible = useMemo(() => actions.filter((action) => {
    const matchesSearch = 
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (action.actionNumber && action.actionNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'open') return !['CLOSED', 'CANCELLED'].includes(action.status);
    if (filter === 'overdue') return isOverdue(action);
    if (filter === 'safety-critical') return action.priority === 'SAFETY_CRITICAL';
    if (filter === 'pre-startup') return isPreStartup(action);
    if (filter === 'closed') return action.status === 'CLOSED';
    return true;
  }), [actions, filter, searchQuery]);

  const filters: Array<[Filter, string, number, string?]> = [
    ['all', 'All', actions.length],
    ['open', 'Open', actions.filter((a) => !['CLOSED', 'CANCELLED'].includes(a.status)).length],
    ['overdue', 'Overdue', actions.filter(isOverdue).length, 'text-danger'],
    ['pre-startup', 'Pre-Startup Blockers', preStartupCount, 'text-red-400 font-bold'],
    ['safety-critical', 'Safety-Critical', actions.filter((a) => a.priority === 'SAFETY_CRITICAL').length],
    ['closed', 'Closed', actions.filter((a) => a.status === 'CLOSED').length]
  ];

  return (
    <div className="space-y-4 psm-fade-in">
      {/* Top Header & Search Bar */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--psm-text)]">Corrective & Preventive Actions (CAPA)</h2>
              <span className="psm-badge psm-badge-primary text-xs">{actions.length}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Unified action items from MOC, HAZOP, Incidents, and Mechanical Integrity linked to this asset.
            </p>
          </div>

          <div className="relative w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions..."
              className="psm-input w-full pl-9 text-xs"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--psm-line)] pt-3">
          {filters.map(([key, label, count, customClass]) => (
            <button 
              key={key} 
              type="button"
              onClick={() => setFilter(key)} 
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === key 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'border border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'
              } ${customClass || ''}`}
            >
              {label} <span className="ml-1 opacity-80">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pre-Startup Alert Banner */}
      {preStartupCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300">
          <ShieldAlert size={18} className="shrink-0 text-red-400" />
          <div>
            <strong className="font-bold text-red-200">Pre-Startup Safety Review (PSSR) Hard Gate:</strong>{' '}
            There {preStartupCount === 1 ? 'is' : 'are'} <strong>{preStartupCount} unresolved pre-startup action(s)</strong>.
            The operating unit cannot be energized or put in-service until evidence is verified and approved.
          </div>
        </div>
      )}

      {/* Table */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-sm text-[var(--psm-muted)]">
          No actions match this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="psm-table w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-xs uppercase tracking-wider text-[var(--psm-muted)]">
                <tr>
                  <th className="px-4 py-3">Action Description</th>
                  <th className="px-4 py-3">Timing Gate</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Controls & Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {visible.map((action) => {
                  const preStart = isPreStartup(action);
                  return (
                    <tr key={action.id} className="hover:bg-[var(--psm-surface-2)]/60 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          {action.priority === 'SAFETY_CRITICAL' ? (
                            <ShieldAlert size={17} className="mt-0.5 shrink-0 text-danger" />
                          ) : isOverdue(action) ? (
                            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-warning" />
                          ) : (
                            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-success" />
                          )}
                          <div>
                            <div className="font-semibold text-[var(--psm-text)]">{action.title}</div>
                            <div className="mt-1 max-w-lg text-xs leading-relaxed text-[var(--psm-muted)]">
                              {action.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {preStart ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-400">
                            PRE-STARTUP
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-0.5 text-[11px] text-[var(--psm-muted)]">
                            POST-STARTUP
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${badgeClass(action.priority)}`}>
                          {action.priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--psm-text)]">
                        <div className="font-medium">{action.assignedTo?.displayName ?? 'Imran Shah'}</div>
                        <div className="text-[11px] text-[var(--psm-muted)]">{action.assignedTo?.department ?? 'HSE Lead'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className={isOverdue(action) ? 'font-bold text-danger' : 'text-[var(--psm-text)]'}>
                          {new Date(action.dueDate).toLocaleDateString()}
                        </div>
                        {isOverdue(action) ? (
                          <div className="text-[11px] font-bold text-danger">Overdue</div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--psm-muted)]">
                            <Clock size={11} /> On schedule
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${badgeClass(action.status)}`}>
                          {action.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => setSelectedActionForEvidence(action)} 
                            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                          >
                            <FileUp size={13} /> Evidence
                          </button>

                          <select
                            value={action.status}
                            onChange={(event) => onUpdateStatus(action.id, event.target.value as EquipmentAction['status'])}
                            className="psm-input px-2 py-1 text-xs"
                          >
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="PENDING_VERIFICATION">Pending Verification</option>
                            <option value="CLOSED">Closed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Evidence Modal */}
      {selectedActionForEvidence && (
        <ActionEvidenceModal
          action={selectedActionForEvidence}
          equipmentTag={equipmentTag}
          onClose={() => setSelectedActionForEvidence(null)}
          onUploadEvidence={async (actionId, file, notes) => {
            onUploadEvidence(actionId);
          }}
          onVerify={async (actionId, notes) => {
            onUpdateStatus(actionId, 'CLOSED');
          }}
        />
      )}
    </div>
  );
}
