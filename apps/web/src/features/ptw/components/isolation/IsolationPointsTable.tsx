import { CheckCircle2, Edit3, ShieldAlert, ShieldCheck, Trash2, UnlockKeyhole, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PermitIsolationPoint } from '../../services/ptw-isolation.service';

export function IsolationPointsTable({ 
  points, 
  onEdit, 
  onDelete, 
  onConfirm, 
  onVerify, 
  onDeIsolate, 
  onRemovalVerify,
  onAuthorizeBypass
}: {
  points: PermitIsolationPoint[];
  onEdit: (point: PermitIsolationPoint) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onVerify: (id: string) => void;
  onDeIsolate: (id: string) => void;
  onRemovalVerify: (id: string) => void;
  onAuthorizeBypass?: (point: PermitIsolationPoint) => void;
}) {
  if (!points.length) return null;

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl">
      {/* Table Header Section */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Isolation Points Register
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Hazardous energy control points state tracking & SCE/SIF bypass verification
          </p>
        </div>
        <span className="rounded-full border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-300 shadow-xs">
          {points.length} {points.length === 1 ? 'point' : 'points'}
        </span>
      </div>

      {/* Luxury Custom-Scroll Table Container */}
      <div 
        className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 max-h-[500px] custom-scrollbar"
      >
        <table className="w-full min-w-[1350px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 backdrop-blur-md">
              {[
                'Energy Type', 'Isolation Point Tag', 'SCE / SIF Gate', 'Equipment Tag', 'Valve / Breaker Tag', 
                'Required Position', 'Current Position', 'Lock Number', 'Lock Holder', 
                'Blind / Spade Number', 'Status', 'Confirmed By', 'Verified By', 'Actions'
              ].map((head) => (
                <th 
                  key={head} 
                  className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 select-none"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
            {points.map((point) => {
              const status = point.isolation_status ?? point.status;
              const isSce = point.is_safety_critical || point.is_sif_bypass;
              const bypassAuthorized = point.bypass_status === 'Authorized';

              return (
                <tr 
                  key={point.id} 
                  className="group hover:bg-slate-100/70 dark:hover:bg-slate-800/30 transition-colors duration-150 ease-in-out"
                >
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{point.energy_type}</td>
                  <td className="px-3 py-2 font-mono font-bold text-sky-600 dark:text-sky-400 tracking-wide group-hover:text-sky-500 dark:group-hover:text-sky-300 transition-colors">
                    {point.isolation_point_tag ?? point.isolation_point}
                  </td>
                  
                  {/* SCE / SIF Barrier Gate Status */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isSce ? (
                      <div className="flex flex-col gap-0.5 items-start">
                        <span className="inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:text-rose-300">
                          <ShieldAlert size={10} className="text-rose-500 dark:text-rose-400" />
                          {point.sil_rating ?? 'SCE Barrier'}
                        </span>
                        {bypassAuthorized ? (
                          <span 
                            className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.2 text-[8px] font-mono font-medium text-emerald-600 dark:text-emerald-300" 
                            title={`Authorized by ${point.bypass_authorized_by || 'Authority'}`}
                          >
                            ✓ {point.bypass_certificate_number ?? 'Bypass Authorized'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAuthorizeBypass?.(point)}
                            className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-200 transition hover:bg-amber-500/30 active:scale-95"
                          >
                            <Zap size={9} className="text-amber-600 dark:text-amber-300 animate-pulse" />
                            Authorize Bypass
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Standard Isolation</span>
                    )}
                  </td>

                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{point.equipment_tag ?? '-'}</td>
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{point.valve_tag ?? point.breaker_tag ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{point.required_position ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{point.current_position ?? point.normal_position ?? '-'}</td>
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{point.lock_number ?? '-'}</td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{point.lock_holder_name ?? point.lock_holder ?? '-'}</td>
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{point.blind_spade_number ?? '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={status} /></td>
                  <td className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">{point.confirmed_by ?? '-'}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">{point.verified_by ?? '-'}</td>
                  
                  {/* Sticky Actions Strip with Soft Ambient Inner Glow and Blur */}
                  <td className="px-2 py-1.5 sticky right-0 z-10 bg-white/95 dark:bg-[#0c1829]/95 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 backdrop-blur-md border-l border-slate-200 dark:border-slate-800/60 transition-colors duration-150 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] dark:shadow-[-15px_0_20px_-10px_rgba(2,6,23,0.6)]">
                    <div className="flex items-center gap-1 pl-1">
                      {isSce && !bypassAuthorized && (
                        <IconButton 
                          title="Authorize SCE Bypass" 
                          warning
                          onClick={() => onAuthorizeBypass?.(point)}
                        >
                          <Zap size={12} />
                        </IconButton>
                      )}
                      <IconButton title="Edit" onClick={() => onEdit(point)}>
                        <Edit3 size={12} />
                      </IconButton>
                      <IconButton 
                        title="Confirm" 
                        disabled={!['Planned', 'Ready For Confirmation'].includes(status)} 
                        onClick={() => onConfirm(point.id)}
                        success
                      >
                        <CheckCircle2 size={12} />
                      </IconButton>
                      <IconButton 
                        title="Verify" 
                        disabled={status !== 'Confirmed'} 
                        onClick={() => onVerify(point.id)}
                        info
                      >
                        <ShieldCheck size={12} />
                      </IconButton>
                      <IconButton 
                        title="De-isolate" 
                        disabled={!['Confirmed', 'Verified', 'De-Isolation Started'].includes(status)} 
                        onClick={() => onDeIsolate(point.id)}
                        warning
                      >
                        <UnlockKeyhole size={12} />
                      </IconButton>
                      <IconButton 
                        title="Removal Verify" 
                        disabled={status !== 'De-Isolated'} 
                        onClick={() => onRemovalVerify(point.id)}
                        info
                      >
                        <ShieldCheck size={12} />
                      </IconButton>
                      <IconButton 
                        title="Delete" 
                        danger 
                        disabled={['Confirmed', 'Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(status)} 
                        onClick={() => onDelete(point.id)}
                      >
                        <Trash2 size={12} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  let colorClasses = 'border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400';
  
  if (['Removal Verified', 'De-Isolated', 'Verified'].includes(status)) {
    colorClasses = 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  } else if (['Confirmed', 'De-Isolation Started'].includes(status)) {
    colorClasses = 'border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400';
  } else if (status === 'Cancelled') {
    colorClasses = 'border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400';
  } else if (status === 'Planned' || status === 'Ready For Confirmation') {
    colorClasses = 'border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400';
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide select-none ${colorClasses}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      {status}
    </span>
  );
}

function IconButton({ 
  title, 
  children, 
  onClick, 
  disabled, 
  danger,
  success,
  info,
  warning
}: { 
  title: string; 
  children: ReactNode; 
  onClick: () => void; 
  disabled?: boolean; 
  danger?: boolean;
  success?: boolean;
  info?: boolean;
  warning?: boolean;
}) {
  let actionColors = 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800';
  
  if (danger) {
    actionColors = 'border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-300';
  } else if (success) {
    actionColors = 'border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300';
  } else if (info) {
    actionColors = 'border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/20 hover:border-sky-300 dark:hover:border-sky-500/40 hover:text-sky-700 dark:hover:text-sky-300';
  } else if (warning) {
    actionColors = 'border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300';
  }

  return (
    <button 
      title={title} 
      disabled={disabled} 
      onClick={onClick} 
      className={`grid h-7 w-7 place-items-center rounded-md border transition-all duration-150 active:scale-95
        disabled:pointer-events-none disabled:opacity-20 ${actionColors}`}
    >
      {children}
    </button>
  );
}