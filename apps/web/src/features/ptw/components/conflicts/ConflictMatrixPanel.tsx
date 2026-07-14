'use client';

import { Grid, Plus } from 'lucide-react';
import type { ConflictMatrixRule } from '../../services/ptw-conflict.service';

export function ConflictMatrixPanel({ 
  rules, 
  onCreate 
}: { 
  rules?: ConflictMatrixRule[] | undefined; 
  onCreate: () => void 
}) {
  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      
      {/* Header Action Strip */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Grid size={16} className="text-sky-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Incompatible Permit Matrix
          </h3>
        </div>
        <button 
          type="button"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 active:scale-95" 
          onClick={onCreate}
        >
          <Plus size={14} className="text-sky-400" />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Main Responsive Layout Table Grid Frame */}
      {rules?.length ? (
        <div 
          className="overflow-auto rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[480px]
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:bg-slate-950/60
            [&::-webkit-scrollbar-track]:rounded-lg
            [&::-webkit-scrollbar-thumb]:bg-slate-800
            [&::-webkit-scrollbar-thumb]:rounded-lg
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
            [&::-webkit-scrollbar-corner]:bg-transparent"
        >
          <table className="w-full min-w-[780px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/95 border-b border-slate-800 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                {[
                  'Permit A', 
                  'Permit B', 
                  'Conflict Profile', 
                  'Severity', 
                  'Block Active', 
                  'Override ok', 
                  'Mandatory Controls'
                ].map((h) => (
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
              {rules.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-800/30 transition-colors duration-150 ease-in-out"
                >
                  {/* Permit Type A Designation Column */}
                  <td className="px-4 py-3.5 font-semibold text-slate-200 whitespace-nowrap">
                    {row.permit_type_a}
                  </td>
                  
                  {/* Permit Type B Designation Column */}
                  <td className="px-4 py-3.5 font-semibold text-slate-200 whitespace-nowrap">
                    {row.permit_type_b}
                  </td>
                  
                  {/* Conflict Custom Group Identifier Column */}
                  <td className="px-4 py-3.5 font-medium text-slate-300 whitespace-nowrap">
                    {row.conflict_type}
                  </td>
                  
                  {/* Severity Priority Profiling Badge Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <SeverityChip value={row.severity} />
                  </td>
                  
                  {/* Block Activation Binary Evaluation Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <BooleanChip active={row.block_activation} variant="danger" />
                  </td>
                  
                  {/* Override Allowed Binary Evaluation Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <BooleanChip active={row.override_allowed} variant="info" />
                  </td>
                  
                  {/* Required Countermeasure Control Description Column */}
                  <td className="px-4 py-3.5 text-slate-400 max-w-xs xl:max-w-md font-normal leading-relaxed">
                    {row.required_control ?? (
                      <span className="text-slate-600 font-sans tracking-normal">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Pure Empty State Fallback Module */
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-xs font-medium text-slate-500">
          No cross-incompatible matrix isolation rules mapped onto this system footprint layer.
        </div>
      )}
    </section>
  );
}

function SeverityChip({ value }: { value?: string | null }) {
  const norm = String(value).trim().toLowerCase();
  let style = 'bg-slate-950 text-slate-400 border border-slate-800';

  if (norm === 'critical' || norm === 'high' || norm === 'severe') {
    style = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  } else if (norm === 'medium' || norm === 'warning' || norm === 'moderate') {
    style = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  } else if (norm === 'low' || norm === 'minor' || norm === 'info') {
    style = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${style}`}>
      {value ?? 'Standard'}
    </span>
  );
}

function BooleanChip({ active, variant }: { active?: boolean | null; variant: 'danger' | 'info' }) {
  let activeStyle = variant === 'danger' 
    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

  return (
    <span 
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase w-10 justify-center
        ${active 
          ? activeStyle 
          : 'bg-slate-950 text-slate-600 border border-slate-800/40'
        }`}
    >
      {active ? 'Yes' : 'No'}
    </span>
  );
}