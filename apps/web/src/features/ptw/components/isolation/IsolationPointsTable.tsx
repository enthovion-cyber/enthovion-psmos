import { CheckCircle2, Edit3, ShieldCheck, Trash2, UnlockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PermitIsolationPoint } from '../../services/ptw-isolation.service';

export function IsolationPointsTable({ points, onEdit, onDelete, onConfirm, onVerify, onDeIsolate, onRemovalVerify }: {
  points: PermitIsolationPoint[];
  onEdit: (point: PermitIsolationPoint) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onVerify: (id: string) => void;
  onDeIsolate: (id: string) => void;
  onRemovalVerify: (id: string) => void;
}) {
  if (!points.length) return null;

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      {/* Table Header Section */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Isolation Points Register
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Hazardous energy control points state tracking
          </p>
        </div>
        <span className="rounded-full border border-slate-700/60 bg-slate-950 px-3 py-1 text-xs font-semibold tracking-wide text-slate-300 shadow-sm">
          {points.length} {points.length === 1 ? 'point' : 'points'}
        </span>
      </div>

      {/* Luxury Custom-Scroll Table Container */}
      <div 
        className="overflow-auto rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[650px]
          [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
          [&::-webkit-scrollbar-track]:bg-slate-950/60
          [&::-webkit-scrollbar-track]:rounded-lg
          [&::-webkit-scrollbar-thumb]:bg-slate-800
          [&::-webkit-scrollbar-thumb]:rounded-lg
          hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
          [&::-webkit-scrollbar-corner]:bg-transparent"
      >
        <table className="w-full min-w-[1550px] text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
              {[
                'Energy Type', 'Isolation Point Tag', 'Equipment Tag', 'Valve / Breaker Tag', 
                'Required Position', 'Current Position', 'Lock Number', 'Lock Holder', 
                'Blind / Spade Number', 'Status', 'Confirmed By', 'Verified By', 'Actions'
              ].map((head) => (
                <th 
                  key={head} 
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 select-none"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {points.map((point) => {
              const status = point.isolation_status ?? point.status;
              return (
                <tr 
                  key={point.id} 
                  className="group hover:bg-slate-800/30 transition-colors duration-150 ease-in-out"
                >
                  <td className="px-4 py-3.5 font-medium text-slate-300">{point.energy_type}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-sky-400 tracking-wide group-hover:text-sky-300 transition-colors">
                    {point.isolation_point_tag ?? point.isolation_point}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{point.equipment_tag ?? '-'}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{point.valve_tag ?? point.breaker_tag ?? '-'}</td>
                  <td className="px-4 py-3.5 text-slate-300 font-medium">{point.required_position ?? '-'}</td>
                  <td className="px-4 py-3.5 text-slate-400">{point.current_position ?? point.normal_position ?? '-'}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{point.lock_number ?? '-'}</td>
                  <td className="px-4 py-3.5 text-slate-300 font-medium">{point.lock_holder_name ?? point.lock_holder ?? '-'}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-300">{point.blind_spade_number ?? '-'}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap"><StatusBadge status={status} /></td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-medium">{point.confirmed_by ?? '-'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-medium">{point.verified_by ?? '-'}</td>
                  
                  {/* Sticky Actions Strip with Soft Ambient Inner Glow and Blur */}
                  <td className="px-4 py-3.5 sticky right-0 z-10 bg-slate-900/90 group-hover:bg-slate-850 backdrop-blur-md border-l border-slate-800/40 transition-colors duration-150 shadow-[-15px_0_20px_-10px_rgba(2,6,23,0.6)]">
                    <div className="flex items-center gap-1.5 pl-2">
                      <IconButton title="Edit" onClick={() => onEdit(point)}>
                        <Edit3 size={14} />
                      </IconButton>
                      <IconButton 
                        title="Confirm" 
                        disabled={!['Planned', 'Ready For Confirmation'].includes(status)} 
                        onClick={() => onConfirm(point.id)}
                        success
                      >
                        <CheckCircle2 size={14} />
                      </IconButton>
                      <IconButton 
                        title="Verify" 
                        disabled={status !== 'Confirmed'} 
                        onClick={() => onVerify(point.id)}
                        info
                      >
                        <ShieldCheck size={14} />
                      </IconButton>
                      <IconButton 
                        title="De-isolate" 
                        disabled={!['Confirmed', 'Verified', 'De-Isolation Started'].includes(status)} 
                        onClick={() => onDeIsolate(point.id)}
                        warning
                      >
                        <UnlockKeyhole size={14} />
                      </IconButton>
                      <IconButton 
                        title="Removal Verify" 
                        disabled={status !== 'De-Isolated'} 
                        onClick={() => onRemovalVerify(point.id)}
                        info
                      >
                        <ShieldCheck size={14} />
                      </IconButton>
                      <IconButton 
                        title="Delete" 
                        danger 
                        disabled={['Confirmed', 'Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(status)} 
                        onClick={() => onDelete(point.id)}
                      >
                        <Trash2 size={14} />
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
  let colorClasses = 'border-slate-800 bg-slate-950 text-slate-400';
  
  if (['Removal Verified', 'De-Isolated', 'Verified'].includes(status)) {
    colorClasses = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
  } else if (['Confirmed', 'De-Isolation Started'].includes(status)) {
    colorClasses = 'border-amber-500/20 bg-amber-500/10 text-amber-400';
  } else if (status === 'Cancelled') {
    colorClasses = 'border-rose-500/20 bg-rose-500/10 text-rose-400';
  } else if (status === 'Planned' || status === 'Ready For Confirmation') {
    colorClasses = 'border-sky-500/20 bg-sky-500/10 text-sky-400';
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide backdrop-blur-sm select-none ${colorClasses}`}>
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
  let actionColors = 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200 hover:bg-slate-800';
  
  if (danger) {
    actionColors = 'border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300';
  } else if (success) {
    actionColors = 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-300';
  } else if (info) {
    actionColors = 'border-sky-500/20 text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-300';
  } else if (warning) {
    actionColors = 'border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300';
  }

  return (
    <button 
      title={title} 
      disabled={disabled} 
      onClick={onClick} 
      className={`grid h-8 w-8 place-items-center rounded-lg border transition-all duration-150 active:scale-95
        disabled:pointer-events-none disabled:opacity-20 ${actionColors}`}
    >
      {children}
    </button>
  );
}