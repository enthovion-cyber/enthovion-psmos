'use client';

import Link from 'next/link';
import { 
  ArrowDownUp, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FileText, 
  RefreshCw, 
  Settings2,
  MoreVertical,
  Info
} from 'lucide-react';
import { Badge, EmptyState, ProgressBar, riskTone, statusTone } from '../pssr-ui';

const columns = [
  ['pssr', 'PSSR No.'],
  ['title', 'Title'],
  ['type', 'Type'],
  ['status', 'Status'],
  ['readiness', 'Readiness'],
  ['location', 'Location'],
  ['equipment', 'Equipment'],
  ['moc', 'Linked MOC'],
  ['startup', 'Target Startup'],
  ['coordinator', 'Coordinator'],
  ['blockers', 'Blockers'],
  ['authorization', 'Authorization'],
  ['updated', 'Last Updated']
];

export function PSSRRegisterTable({ 
  register, 
  visibleColumns, 
  onPage, 
  onSort, 
  onToggleColumn, 
  onReadinessCheck 
}: { 
  register: any; 
  visibleColumns: string[]; 
  onPage: (page: number) => void; 
  onSort: (sort: string) => void; 
  onToggleColumn: (column: string) => void; 
  onReadinessCheck: (id: string) => void;
}) {
  const rows = register?.rows ?? [];

  // Tailored style mapper mimicking the glowing text indicator badges in the target mockup
  const getCustomStatusBadge = (status: string) => {
    const cleaned = (status ?? '').toLowerCase();
    if (cleaned === 'in review') return 'border-blue-500/30 bg-blue-950/40 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.1)]';
    if (cleaned === 'field verification') return 'border-amber-500/30 bg-amber-950/30 text-amber-400';
    if (cleaned === 'ready') return 'border-yellow-500/30 bg-yellow-950/40 text-yellow-400';
    if (cleaned === 'blocked') return 'border-rose-500/20 bg-rose-950/50 text-rose-400';
    if (cleaned === 'authorized') return 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400';
    if (cleaned === 'released') return 'border-green-500/30 bg-green-950/40 text-green-400';
    return 'border-slate-800 bg-slate-900/60 text-slate-400';
  };

  return (
    <section className="rounded-xl border border-slate-800/80 bg-[#040d1a]/95 shadow-2xl backdrop-blur-md">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-4 border-b border-slate-900/80 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-white">PSSR Register</h2>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-slate-400 border border-slate-800">
                {register?.total ?? 0}
              </span>
              <Info size={14} className="text-slate-500 cursor-help" />
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Page {register?.page ?? 1} of {register?.pageCount ?? 1}
            </p>
          </div>
        </div>

        {/* Top Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select 
              value={register?.sort ?? '-updated_at'} 
              onChange={(event) => onSort(event.target.value)} 
              className="h-9 appearance-none rounded-lg border border-slate-800 bg-slate-950/60 pl-3 pr-8 text-xs font-medium text-slate-300 outline-none transition-all focus:border-sky-500/40"
            >
              <option value="-updated_at">Newest updated</option>
              <option value="updated_at">Oldest updated</option>
              <option value="target_startup_at">Startup earliest</option>
              <option value="-readiness_percent">Readiness high first</option>
              <option value="readiness_percent">Readiness low first</option>
              <option value="pssr_number">PSSR number</option>
            </select>
          </div>

          <details className="relative group">
            <summary className="inline-flex h-9 list-none cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white">
              <Settings2 size={13} className="text-slate-400 group-hover:text-slate-200" /> 
              <span>Columns</span>
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-56 origin-top-right rounded-xl border border-slate-800 bg-[#051122] p-2.5 shadow-2xl backdrop-blur-md">
              <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
                {columns.map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.03] hover:text-slate-200">
                    <input 
                      type="checkbox" 
                      checked={visibleColumns.includes(key)} 
                      onChange={() => onToggleColumn(key)} 
                      className="rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Main Table Layer Matrix */}
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/20 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {columns.filter(([key]) => visibleColumns.includes(key)).map(([key, label]) => (
                  <th key={key} className="px-4 py-3.5 font-semibold">
                    {key === 'startup' ? (
                      <button onClick={() => onSort('target_startup_at')} className="inline-flex items-center gap-1.5 hover:text-slate-200 transition-colors">
                        <span>{label}</span>
                        <ArrowDownUp size={12} className="text-slate-500" />
                      </button>
                    ) : (
                      <span>{label}</span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-xs">
              {rows.map((item: any) => (
                <tr key={item.id} className="group border-t border-slate-900/40 transition-colors duration-150 hover:bg-sky-500/[0.015]">
                  
                  {visibleColumns.includes('pssr') && (
                    <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                      <Link href={`/pssr/${item.id}`} className="font-semibold text-sky-400 hover:underline">
                        {item.pssr_number}
                      </Link>
                    </td>
                  )}

                  {visibleColumns.includes('title') && (
                    <td className="px-4 py-3.5 text-slate-300 min-w-[200px] max-w-xs truncate">
                      {item.title}
                    </td>
                  )}

                  {visibleColumns.includes('type') && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-slate-200">{item.pssr_type}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{item.startup_type}</span>
                    </td>
                  )}

                  {visibleColumns.includes('status') && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getCustomStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                      {item.risk_level && (
                        <span className="block mt-1.5">
                          <Badge tone={riskTone(item.risk_level)}>{item.risk_level}</Badge>
                        </span>
                      )}
                    </td>
                  )}

                  {visibleColumns.includes('readiness') && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="w-36 flex items-center gap-3">
                        <div className="flex-1">
                          <ProgressBar 
                            value={item.readinessPercent} 
                            tone={item.openBlockersCount ? 'red' : item.readinessPercent >= 90 ? 'green' : 'blue'} 
                          />
                        </div>
                        <span className="text-slate-300 font-semibold tracking-tight text-right w-8 shrink-0">
                          {item.readinessPercent}%
                        </span>
                      </div>
                    </td>
                  )}

                  {visibleColumns.includes('location') && (
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                      <span>{item.unitName ?? item.siteName}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{item.areaName}</span>
                    </td>
                  )}

                  {visibleColumns.includes('equipment') && (
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                      <span className="font-medium tracking-tight">{item.primaryEquipmentTag}</span>
                      {item.primaryEquipmentName && (
                        <span className="block text-[11px] text-slate-500 mt-0.5">{item.primaryEquipmentName}</span>
                      )}
                    </td>
                  )}

                  {visibleColumns.includes('moc') && (
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap font-medium">
                      <span className="text-slate-300">{item.linkedMocNumber ?? '-'}</span>
                    </td>
                  )}

                  {visibleColumns.includes('startup') && (
                    <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                      <span>{item.target_startup_at ? new Date(item.target_startup_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                      {item.target_startup_at && new Date(item.target_startup_at).getTime() < Date.now() && !['Closed', 'Startup Released'].includes(item.status) && (
                        <span className="inline-block ml-2 rounded bg-rose-500/10 px-1 py-0.2 text-[9px] font-bold tracking-wider uppercase text-rose-400 border border-rose-500/20">Overdue</span>
                      )}
                    </td>
                  )}

                  {visibleColumns.includes('coordinator') && (
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{item.coordinatorName}</td>
                  )}

                  {visibleColumns.includes('blockers') && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold ${item.openBlockersCount ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                        {item.openBlockersCount ?? 0}
                      </span>
                    </td>
                  )}

                  {visibleColumns.includes('authorization') && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-slate-300 font-medium block">{item.authorization_status ?? '-'}</span>
                      {item.authorizationPendingCount > 0 && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">by {item.coordinatorName}</span>
                      )}
                    </td>
                  )}

                  {visibleColumns.includes('updated') && (
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {item.updated_at ? new Date(item.updated_at).toLocaleString([], { dateStyle: 'short' }) : '-'}
                    </td>
                  )}

                  {/* Inline Command Toolbar */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Link href={`/pssr/${item.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-950/40 text-slate-400 hover:border-sky-500/30 hover:text-sky-400 transition-all" title="Open detail">
                        <Eye size={13} />
                      </Link>
                      <button onClick={() => onReadinessCheck(item.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-950/40 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400 transition-all" title="Trigger readiness check">
                        <RefreshCw size={13} />
                      </button>
                      <Link href={`/pssr/${item.id}?export=report`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-950/40 text-slate-400 hover:border-amber-500/30 hover:text-amber-400 transition-all" title="Export report">
                        <FileText size={13} />
                      </Link>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900">
                        <MoreVertical size={13} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8">
          <EmptyState 
            title="No PSSR records match the current filters" 
            detail="Change filters, clear quick tabs, or create a new PSSR from the register header." 
          />
        </div>
      )}

      {/* Structural Interactive Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-900 bg-slate-950/20 p-4 rounded-b-xl">
        <p className="text-xs font-medium text-slate-400">
          Showing <span className="text-slate-200">{rows.length}</span> of <span className="text-slate-200">{register?.total ?? 0}</span> records
        </p>
        <div className="flex gap-2">
          <button 
            disabled={(register?.page ?? 1) <= 1} 
            onClick={() => onPage((register?.page ?? 1) - 1)} 
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={13} /> 
            <span>Prev</span>
          </button>
          <button 
            disabled={(register?.page ?? 1) >= (register?.pageCount ?? 1)} 
            onClick={() => onPage((register?.page ?? 1) + 1)} 
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/40 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span>Next</span> 
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}