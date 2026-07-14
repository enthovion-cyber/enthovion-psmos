'use client';

import { ShieldCheck, Plus } from 'lucide-react';
import type { SimopsControl } from '../../services/ptw-conflict.service';

export function SIMOPSControlsTable({ 
  controls, 
  onAdd 
}: { 
  controls?: SimopsControl[] | undefined; 
  onAdd: () => void 
}) {
  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      
      {/* Premium Header Utility Action Strip */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-sky-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            SIMOPS Controls
          </h3>
        </div>
        <button 
          type="button"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 active:scale-95" 
          onClick={onAdd}
        >
          <Plus size={14} className="text-sky-400" />
          <span>Add Control</span>
        </button>
      </div>

      {/* Main Responsive Interactive Viewport Grid */}
      {controls?.length ? (
        <div 
          className="overflow-auto rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[440px]
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:bg-slate-950/60
            [&::-webkit-scrollbar-track]:rounded-lg
            [&::-webkit-scrollbar-thumb]:bg-slate-800
            [&::-webkit-scrollbar-thumb]:rounded-lg
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
            [&::-webkit-scrollbar-corner]:bg-transparent"
        >
          <table className="w-full min-w-[700px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/95 border-b border-slate-800 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                {['Control Description', 'Responsible Party', 'Due Date', 'Status', 'Completed Timestamp'].map((h) => (
                  <th 
                    key={h} 
                    className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] select-none whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {controls.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-800/30 transition-colors duration-150 ease-in-out"
                >
                  {/* Control Core Description Text Block */}
                  <td className="px-4 py-3.5 font-medium text-slate-200 leading-relaxed max-w-xs md:max-w-md">
                    {row.control_description}
                  </td>
                  
                  {/* Responsible Operator Reference Node */}
                  <td className="px-4 py-3.5 font-semibold text-slate-400 whitespace-nowrap">
                    {row.responsible_user_id ?? (
                      <span className="text-slate-600 tracking-wide font-normal">-</span>
                    )}
                  </td>
                  
                  {/* Action Item Expiry Target Block */}
                  <td className="px-4 py-3.5 font-mono text-slate-400 tracking-wide whitespace-nowrap">
                    {row.due_at ? (
                      new Date(row.due_at).toLocaleString()
                    ) : (
                      <span className="text-slate-600 font-sans tracking-normal font-normal">-</span>
                    )}
                  </td>
                  
                  {/* Scannable Status Indicator Matrix Tag */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>
                  
                  {/* Ultimate Execution Timestamp Audit Log Entry */}
                  <td className="px-4 py-3.5 font-mono text-slate-400 tracking-wide whitespace-nowrap">
                    {row.completed_at ? (
                      new Date(row.completed_at).toLocaleString()
                    ) : (
                      <span className="text-slate-600 font-sans tracking-normal font-normal">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Pure Empty State Database Fallback Element */
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-xs font-medium text-slate-500">
          No mandatory SIMOPS mitigation parameters or control logs mapped onto this environment matrix.
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const norm = String(status).trim().toLowerCase();
  
  let layoutStyle = 'bg-slate-950 text-slate-400 border border-slate-800';
  
  if (norm === 'open' || norm === 'pending') {
    layoutStyle = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  } else if (norm === 'closed' || norm === 'completed' || norm === 'verified') {
    layoutStyle = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  } else if (norm === 'active' || norm === 'in progress') {
    layoutStyle = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${layoutStyle}`}>
      {status ?? 'Unknown'}
    </span>
  );
}