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
    <section className="group/section relative rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0a192f]/95 via-[#071424]/98 to-[#050e1a]/95 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/20">
      
      {/* Top Banner / Header Actions */}
      <div className="flex flex-col gap-4 border-b border-slate-800/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-widest text-cyan-400/90">
              Management of Change
            </h2>
          </div>
          <h1 className="mt-1 text-lg font-bold tracking-tight text-white/95">MOC Register</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400/80">
            Searchable, filterable register with lifecycle tracking, workflow milestones, automated risk validation, and closure health.
          </p>
        </div>
        
        {/* Total Badge Indicator */}
        <div className="flex items-center self-start rounded-full bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 text-xs font-medium tracking-wide text-slate-300 backdrop-blur-sm sm:self-center">
          <span className="font-extrabold text-cyan-400">{total}</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span>Page {page} of {pages}</span>
        </div>
      </div>

      {/* State Handlers */}
      {isLoading && (
        <div className="flex items-center justify-center p-12 bg-slate-950/20 rounded-b-2xl">
          <LoadingState />
        </div>
      )}
      
      {isError && (
        <div className="p-6">
          <ErrorState message="Unable to safely synchronize dashboard record stream with registry API." />
        </div>
      )}
      
      {!isLoading && !isError && !rows.length && (
        <div className="p-12 text-center">
          <EmptyState title="No match found for active query layers" detail="Reset existing UI filter arrays or generate a fresh structured change request." />
        </div>
      )}

      {/* Main High-Performance Scroll Container */}
      {!isLoading && !isError && rows.length ? (
        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
          <table className="w-full min-w-[1780px] table-layout-fixed border-collapse text-left text-xs">
            
            {/* Sticky Header Row */}
            <thead className="sticky top-0 z-10 border-b border-slate-800/80 bg-[#081729] font-semibold uppercase tracking-wider text-slate-400/90 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.5)]">
              <tr>
                {[
                  { name: 'MOC', sortable: true, width: 'w-[110px]' },
                  { name: 'Title / Scope', sortable: false, width: 'w-[280px]' },
                  { name: 'Type', sortable: false, width: 'w-[140px]' },
                  { name: 'Risk', sortable: false, width: 'w-[90px]' },
                  { name: 'Status', sortable: false, width: 'w-[100px]' },
                  { name: 'Workflow', sortable: false, width: 'w-[150px]' },
                  { name: 'Approver', sortable: false, width: 'w-[140px]' },
                  { name: 'Originator', sortable: false, width: 'w-[140px]' },
                  { name: 'Department', sortable: false, width: 'w-[130px]' },
                  { name: 'Location / Area', sortable: false, width: 'w-[180px]' },
                  { name: 'Equipment Tag', sortable: false, width: 'w-[140px]' },
                  { name: 'Target Date', sortable: true, width: 'w-[120px]' },
                  { name: 'Days Open', sortable: true, width: 'w-[100px]' },
                  { name: 'Temp Expiry', sortable: false, width: 'w-[120px]' },
                  { name: 'Blockers', sortable: false, width: 'w-[110px]' },
                  { name: 'Actions %', sortable: false, width: 'w-[95px]' },
                  { name: 'Health Matrix', sortable: false, width: 'w-[180px]' },
                  { name: 'Actions', sortable: false, width: 'w-[165px]' },
                ].map((col) => (
                  <th key={col.name} className={`px-4 py-3.5 font-bold transition-colors hover:bg-slate-800/20 ${col.width}`}>
                    <span className="flex items-center gap-1.5 cursor-pointer select-none">
                      {col.name}
                      {col.sortable && <ArrowUpDown size={11} className="text-slate-500 hover:text-cyan-400 transition-colors" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Core Payload */}
            <tbody className="divide-y divide-slate-800/40 bg-transparent">
              {rows.map((row: any) => (
                <tr 
                  key={row.id} 
                  className="group/row transition-all duration-150 ease-out hover:bg-cyan-500/[0.025]"
                >
                  {/* MOC Number identifier */}
                  <td className="px-4 py-3.5 align-middle">
                    <Link 
                      href={`/moc/${row.id}`} 
                      className="font-mono text-[13px] font-black tracking-wide text-cyan-300/90 transition-colors duration-150 hover:text-cyan-200 hover:underline decoration-cyan-400/40 underline-offset-4"
                    >
                      {row.moc_number ?? row.mocNumber}
                    </Link>
                    <p className={`mt-0.5 text-[10px] font-medium uppercase tracking-wider ${row.priority === 'High' || row.priority === 'Emergency' ? 'text-rose-400/90' : 'text-slate-500'}`}>
                      {row.priority ?? 'Normal'} priority
                    </p>
                  </td>

                  {/* Context Title Info */}
                  <td className="px-4 py-3.5 align-middle">
                    <p className="truncate text-[13px] font-bold text-slate-100 group-hover/row:text-white transition-colors">
                      {row.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400/70" title={row.description ?? row.affected_system}>
                      {row.description ?? row.affected_system ?? 'No additional metadata available'}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 align-middle font-medium text-slate-300">
                    {row.change_type ?? row.changeType}
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <Badge tone={riskTone(row.risk_level ?? row.riskLevel)}>
                      {row.risk_level ?? row.riskLevel ?? 'Low'}
                    </Badge>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <Badge tone={statusTone(row.status)}>
                      {row.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-3.5 align-middle font-medium text-slate-300">
                    <div className="truncate max-w-[140px]" title={row.currentWorkflowStep ?? row.workflow_status}>
                      {row.currentWorkflowStep ?? row.workflow_status ?? row.workflowStatus ?? 'Not started'}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle text-slate-300 font-medium truncate" title={row.currentApprover}>
                    {row.currentApprover ?? <span className="text-slate-600">-</span>}
                  </td>

                  <td className="px-4 py-3.5 align-middle text-slate-300 font-medium truncate" title={row.originator?.displayName ?? row.originator_id}>
                    {row.originator?.displayName ?? row.originator_id ?? <span className="text-slate-600">-</span>}
                  </td>

                  <td className="px-4 py-3.5 align-middle text-slate-300 font-medium truncate" title={row.department?.name ?? row.department_id}>
                    {row.department?.name ?? row.department_id ?? <span className="text-slate-600">-</span>}
                  </td>

                  <td className="px-4 py-3.5 align-middle text-slate-300 font-medium truncate">
                    <span className="text-slate-200">{row.site?.name ?? row.site_name ?? row.site_id ?? <span className="text-slate-600">-</span>}</span>
                    <span className="mx-1 text-slate-600">/</span>
                    <span className="text-slate-400 text-[11px]">{row.unit?.name ?? row.unit_name ?? row.unit_id ?? <span className="text-slate-600">-</span>}</span>
                  </td>

                  <td className="px-4 py-3.5 align-middle font-mono text-[11px] text-slate-300" title={row.primaryEquipment?.name}>
                    {row.primaryEquipment?.tag ?? row.primaryEquipment?.name ?? <span className="text-slate-600">-</span>}
                  </td>

                  <td className="px-4 py-3.5 align-middle text-slate-300 font-medium">
                    {row.target_implementation_date ?? row.targetImplementationDate ?? <span className="text-slate-600">-</span>}
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${Number(row.daysOpen) > 60 ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300'}`}>
                      {row.daysOpen ?? 0} d
                    </span>
                  </td>

                  <td className="px-4 py-3.5 align-middle text-slate-300 font-medium">
                    {row.temporaryExpiryDate ?? <span className="text-slate-600">-</span>}
                  </td>

                  {/* Blocker Tags */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex gap-1.5">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black tracking-wider ${row.startupBlockersCount ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/10'}`}>
                        S:{row.startupBlockersCount ?? 0}
                      </span>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black tracking-wider ${row.closureBlockersCount ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/10'}`}>
                        C:{row.closureBlockersCount ?? 0}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle font-mono text-xs font-bold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                        <div className="h-full bg-cyan-400/80 rounded-full" style={{ width: `${row.requiredActionsCompletion ?? 100}%` }} />
                      </div>
                      <span>{row.requiredActionsCompletion ?? 100}%</span>
                    </div>
                  </td>

                  {/* Health Matrix Badge Array */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={row.healthStatus === 'Red' ? 'red' : row.healthStatus === 'Amber' ? 'amber' : 'green'}>
                        {row.healthStatus ?? 'Green'}
                      </Badge>
                      {row.change_type === 'Temporary Change' && <Badge tone="purple">TEMP</Badge>}
                      {row.change_type === 'Emergency Change' && <Badge tone="red">EMERG</Badge>}
                      {row.pssrStatus && row.pssrStatus !== 'Not Required' && <Badge tone="amber">PSSR</Badge>}
                    </div>
                  </td>

                  {/* Action Group */}
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center gap-1.5 opacity-80 transition-opacity group-hover/row:opacity-100">
                      <button 
                        title="Preview" 
                        onClick={() => setSelectedMocId(row.id)} 
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      <Link 
                        title="Open full records" 
                        href={`/moc/${row.id}`} 
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      <button 
                        title="Duplicate record" 
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-all"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        title="Export document report" 
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-all"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Modern Compact Control Footer */}
      <div className="flex flex-col gap-4 border-t border-slate-800/60 p-4 sm:flex-row sm:items-center sm:justify-between bg-[#040d18]/50 rounded-b-2xl">
        <div className="text-xs font-medium text-slate-500 text-center sm:text-left order-2 sm:order-1">
          Showing <span className="text-slate-400">{rows.length}</span> of <span className="text-slate-400">{total}</span> records · <span className="text-slate-400">{limit}</span> entries per view slice
        </div>
        
        <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
          <button 
            disabled={page <= 1} 
            onClick={() => setFilter('page', page - 1)} 
            className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white disabled:pointer-events-none disabled:opacity-25"
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          
          <div className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2 text-xs font-black text-cyan-400">
            {page}
          </div>

          <button 
            disabled={page >= pages} 
            onClick={() => setFilter('page', page + 1)} 
            className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold text-slate-300 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white disabled:pointer-events-none disabled:opacity-25"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Injection of standard styled CSS scrollbars */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #050d17;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </section>
  );
}