'use client';

import Link from 'next/link';
import { ArrowUpDown, Copy, Download, ExternalLink, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState, riskTone, statusTone } from '../moc-detail-ui';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

export function MOCRegisterTable({ 
  register, 
  isLoading, 
  isError 
}: { 
  register?: any; 
  isLoading?: boolean; 
  isError?: boolean 
}) {
  const { filters, setFilter, setSelectedMocId } = useMOCDashboardStore();
  const rows = Array.isArray(register) ? register : register?.items ?? [];
  const page = Number(register?.page ?? filters.page ?? 1);
  const total = Number(register?.total ?? rows.length);
  const limit = Number(register?.limit ?? filters.limit ?? 25);
  const pages = Math.max(Math.ceil(total / limit), 1);

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm transition-colors text-[var(--psm-fg)] w-full">
      {/* Top Banner / Header Actions */}
      <div className="flex flex-col gap-4 border-b border-[var(--psm-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
              Management of Change Register
            </h2>
          </div>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-[var(--psm-fg)]">
            Active Changes & Workflow Register
          </h1>
          <p className="mt-0.5 text-xs text-[var(--psm-muted)]">
            Live technical change registry with automated risk levels, workflow approvals, and pre-startup gating.
          </p>
        </div>
        
        {/* Total Badge Indicator */}
        <div className="flex items-center self-start rounded-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)] px-3 py-1 text-xs font-semibold text-[var(--psm-muted)] sm:self-center">
          <span className="font-bold text-[var(--psm-fg)]">{total} Total</span>
          <span className="mx-1.5 opacity-40">·</span>
          <span>Page {page} of {pages}</span>
        </div>
      </div>

      {/* State Handlers */}
      {isLoading && (
        <div className="p-8">
          <LoadingState />
        </div>
      )}
      
      {isError && (
        <div className="p-6">
          <ErrorState message="Unable to safely synchronize record stream with registry API." />
        </div>
      )}
      
      {!isLoading && !isError && !rows.length && (
        <div className="p-8 text-center">
          <EmptyState
            title="No MOC records found for current filters"
            detail="Reset active filters above or create a new Management of Change request."
          />
        </div>
      )}

      {/* Scrollable Table Container */}
      {!isLoading && !isError && rows.length ? (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
            {/* Table Header Row */}
            <thead className="border-b border-[var(--psm-line)] bg-[var(--psm-surface-2)] font-bold uppercase tracking-wider text-[var(--psm-muted)]">
              <tr>
                <th className="px-3.5 py-3 w-[120px]">MOC Number</th>
                <th className="px-3.5 py-3 min-w-[240px]">Title & Scope</th>
                <th className="px-3.5 py-3 w-[150px]">Change Type</th>
                <th className="px-3.5 py-3 w-[100px]">Risk Level</th>
                <th className="px-3.5 py-3 w-[110px]">Status</th>
                <th className="px-3.5 py-3 w-[140px]">Workflow Step</th>
                <th className="px-3.5 py-3 w-[130px]">Approver</th>
                <th className="px-3.5 py-3 w-[130px]">Originator</th>
                <th className="px-3.5 py-3 w-[160px]">Site / Unit</th>
                <th className="px-3.5 py-3 w-[120px]">Equipment</th>
                <th className="px-3.5 py-3 w-[110px]">Target Date</th>
                <th className="px-3.5 py-3 w-[90px]">Blockers</th>
                <th className="px-3.5 py-3 w-[100px]">Actions %</th>
                <th className="px-3.5 py-3 w-[110px] text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[var(--psm-line)]">
              {rows.map((row: any) => (
                <tr 
                  key={row.id} 
                  className="transition-colors hover:bg-[var(--psm-surface-2)]"
                >
                  {/* MOC Number identifier */}
                  <td className="px-3.5 py-3 align-middle">
                    <Link 
                      href={`/moc/${row.id}`} 
                      className="font-mono text-xs font-bold text-primary hover:underline"
                    >
                      {row.moc_number ?? row.mocNumber}
                    </Link>
                    <p className={`mt-0.5 text-[10px] font-semibold uppercase ${
                      row.priority === 'High' || row.priority === 'Emergency' ? 'text-rose-500' : 'text-[var(--psm-muted)]'
                    }`}>
                      {row.priority ?? 'Normal'}
                    </p>
                  </td>

                  {/* Title & Description */}
                  <td className="px-3.5 py-3 align-middle">
                    <p className="truncate max-w-[280px] font-bold text-[var(--psm-fg)]">
                      {row.title}
                    </p>
                    <p className="mt-0.5 truncate max-w-[280px] text-[11px] text-[var(--psm-muted)]" title={row.description ?? row.affected_system}>
                      {row.description ?? row.affected_system ?? 'No additional description'}
                    </p>
                  </td>

                  <td className="px-3.5 py-3 align-middle text-[var(--psm-fg)] font-medium">
                    {row.change_type ?? row.changeType}
                  </td>

                  <td className="px-3.5 py-3 align-middle">
                    <Badge tone={riskTone(row.risk_level ?? row.riskLevel)}>
                      {row.risk_level ?? row.riskLevel ?? 'Low'}
                    </Badge>
                  </td>

                  <td className="px-3.5 py-3 align-middle">
                    <Badge tone={statusTone(row.status)}>
                      {row.status}
                    </Badge>
                  </td>

                  <td className="px-3.5 py-3 align-middle text-[var(--psm-muted)] font-medium">
                    <div className="truncate max-w-[130px]" title={row.currentWorkflowStep ?? row.workflow_status}>
                      {row.currentWorkflowStep ?? row.workflow_status ?? row.workflowStatus ?? 'Not started'}
                    </div>
                  </td>

                  <td className="px-3.5 py-3 align-middle text-[var(--psm-muted)] truncate" title={row.currentApprover}>
                    {row.currentApprover ?? '-'}
                  </td>

                  <td className="px-3.5 py-3 align-middle text-[var(--psm-muted)] truncate" title={row.originator?.displayName ?? row.originator_id}>
                    {row.originator?.displayName ?? row.originator_id ?? '-'}
                  </td>

                  <td className="px-3.5 py-3 align-middle text-[var(--psm-muted)] truncate">
                    <span className="text-[var(--psm-fg)]">{row.site?.name ?? row.site_name ?? row.site_id ?? '-'}</span>
                    <span className="mx-1 opacity-40">/</span>
                    <span>{row.unit?.name ?? row.unit_name ?? row.unit_id ?? '-'}</span>
                  </td>

                  <td className="px-3.5 py-3 align-middle font-mono text-[11px] text-[var(--psm-fg)]" title={row.primaryEquipment?.name}>
                    {row.primaryEquipment?.tag ?? row.primaryEquipment?.name ?? '-'}
                  </td>

                  <td className="px-3.5 py-3 align-middle text-[var(--psm-muted)] font-mono">
                    {row.target_implementation_date ?? row.targetImplementationDate ?? '-'}
                  </td>

                  {/* Blocker Counts */}
                  <td className="px-3.5 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        row.startupBlockersCount ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        S:{row.startupBlockersCount ?? 0}
                      </span>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        row.closureBlockersCount ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        C:{row.closureBlockersCount ?? 0}
                      </span>
                    </div>
                  </td>

                  {/* Actions Progress */}
                  <td className="px-3.5 py-3 align-middle font-mono font-bold text-[var(--psm-fg)]">
                    {row.requiredActionsCompletion ?? 100}%
                  </td>

                  {/* Action Group */}
                  <td className="px-3.5 py-3 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        type="button"
                        title="Preview details" 
                        onClick={() => setSelectedMocId(row.id)} 
                        className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-1.5 text-[var(--psm-muted)] hover:text-[var(--psm-fg)] hover:bg-[var(--psm-surface-3)] transition-colors"
                      >
                        <MoreHorizontal size={13} />
                      </button>
                      <Link 
                        title="Open full MOC workspace" 
                        href={`/moc/${row.id}`} 
                        className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-1.5 text-[var(--psm-muted)] hover:text-primary hover:bg-[var(--psm-surface-3)] transition-colors"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-[var(--psm-line)] p-3.5 sm:flex-row sm:items-center sm:justify-between bg-[var(--psm-surface-2)] rounded-b-xl text-xs text-[var(--psm-muted)]">
        <div>
          Showing <strong>{rows.length}</strong> of <strong>{total}</strong> records · <strong>{limit}</strong> per page
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            disabled={page <= 1} 
            onClick={() => setFilter('page', page - 1)} 
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 text-xs font-bold text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-3)] disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={13} />
            Prev
          </button>
          
          <div className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-2 text-xs font-bold text-primary">
            {page}
          </div>

          <button 
            type="button"
            disabled={page >= pages} 
            onClick={() => setFilter('page', page + 1)} 
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 text-xs font-bold text-[var(--psm-fg)] transition-colors hover:bg-[var(--psm-surface-3)] disabled:opacity-30 disabled:pointer-events-none"
          >
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
