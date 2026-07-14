'use client';

import { CheckCircle2, RefreshCcw, ShieldX, XCircle, FileSignature } from 'lucide-react';
import type { PermitSignature } from '../../services/ptw-signature.service';

// Contextual dynamic state styles mapping for deep slate interfaces
function getStatusStyles(status: string) {
  const norm = String(status).trim().toLowerCase();
  if (norm === 'signed') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  }
  if (norm === 'rejected') {
    return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
  }
  if (norm === 'expired' || norm === 'revalidation required') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
  }
  return 'border-slate-800 bg-slate-950/60 text-slate-400';
}

export function RequiredSignaturesTable({
  signatures,
  loading = false,
  onGenerate,
  onSign,
  onReject,
  onRevalidate
}: {
  signatures?: PermitSignature[] | undefined;
  loading?: boolean;
  onGenerate: () => void;
  onSign: (signature: PermitSignature) => void;
  onReject: (signature: PermitSignature) => void;
  onRevalidate: (signature: PermitSignature) => void;
}) {
  const rows = signatures ?? [];

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      
      {/* Structural Header Action Layout Matrix */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSignature size={16} className="text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Required Signatures
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Role-based signatures generated from permit type, risk, isolation, gas test, SIMOPS, handover, and closure rules.
          </p>
        </div>
        <button 
          type="button"
          onClick={onGenerate} 
          className="inline-flex items-center justify-center gap-1.5 self-start lg:self-auto rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-sky-500 active:scale-95 shadow-lg shadow-sky-950/20"
        >
          <RefreshCcw size={14} className="text-sky-100" />
          <span>Generate Requirements</span>
        </button>
      </div>

      {/* Dynamic Processing Status Box */}
      {loading && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-6 text-xs font-medium text-slate-400 animate-pulse">
          Loading active signature matrix elements...
        </div>
      )}

      {/* Pure Empty State Fallback Screen */}
      {!loading && !rows.length && (
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-xs font-medium text-slate-500">
          No signature requirements generated yet. Generate requirements from permit context definitions above.
        </div>
      )}

      {/* Main High-Density Layout Table Box with Viewport Constraints */}
      {!loading && rows.length ? (
        <div 
          className="overflow-auto rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[520px]
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:bg-slate-950/60
            [&::-webkit-scrollbar-track]:rounded-lg
            [&::-webkit-scrollbar-thumb]:bg-slate-800
            [&::-webkit-scrollbar-thumb]:rounded-lg
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
            [&::-webkit-scrollbar-corner]:bg-transparent"
        >
          <table className="w-full min-w-[1080px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/95 border-b border-slate-800 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                {[
                  'Signature Role', 
                  'Required For', 
                  'Assigned User / Role', 
                  'Status', 
                  'Signed By', 
                  'Signed At', 
                  'IP Address', 
                  'Comment / Reason', 
                  'Actions Control Matrix'
                ].map((head) => (
                  <th 
                    key={head} 
                    className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] select-none whitespace-nowrap"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {rows.map((row) => {
                const role = row.signature_role ?? row.signature_type ?? '-';
                const signedAt = row.signed_at ? new Date(row.signed_at).toLocaleString() : '-';
                const isSigned = row.status === 'Signed';

                return (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-800/20 transition-colors duration-150 ease-in-out align-top"
                  >
                    {/* Primary Role & Mandate Purpose Column */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{role}</div>
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5 max-w-[180px] break-words">
                        {row.signature_purpose ?? '-'}
                      </div>
                    </td>

                    {/* Operational Target Status Condition Column */}
                    <td className="px-4 py-3.5 font-medium text-slate-300 whitespace-nowrap">
                      {row.required_for_status ?? '-'}
                    </td>

                    {/* Allocated Operator/Role Target Node Column */}
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      {row.assigned_user_id ?? row.assigned_role_id ?? (
                        <span className="text-slate-500 italic">Role based</span>
                      )}
                    </td>

                    {/* Verified Status Pill Container Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${getStatusStyles(row.status ?? '')}`}>
                        {row.status ?? 'Unknown'}
                      </span>
                    </td>

                    {/* Signee Metadata Trace Column */}
                    <td className="px-4 py-3.5 font-medium text-slate-400 whitespace-nowrap">
                      {row.signed_by ?? '-'}
                    </td>

                    {/* Chronological Action Timestamp Entry Column */}
                    <td className="px-4 py-3.5 font-mono text-slate-400 tracking-wide whitespace-nowrap">
                      {signedAt}
                    </td>

                    {/* Target Access Host Node Identity Column */}
                    <td className="px-4 py-3.5 font-mono text-slate-500 tracking-wider whitespace-nowrap">
                      {row.ip_address ?? '-'}
                    </td>

                    {/* Feedback Exception & Narrative Text Block Column */}
                    <td className="px-4 py-3.5 max-w-[220px] text-slate-400 leading-relaxed font-normal">
                      {row.rejection_reason ? (
                        <span className="text-rose-400 font-medium">{row.rejection_reason}</span>
                      ) : (
                        row.comment ?? <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Transaction Control Execution Operations Action Strip Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          disabled={isSigned} 
                          onClick={() => onSign(row)} 
                          className="inline-flex items-center gap-1 h-7 rounded bg-slate-950 border border-slate-800 px-2.5 text-[11px] font-bold text-emerald-400 shadow-sm transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-800 disabled:hover:text-emerald-400 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 size={12} />
                          <span>Sign</span>
                        </button>
                        
                        <button 
                          type="button"
                          disabled={isSigned} 
                          onClick={() => onReject(row)} 
                          className="inline-flex items-center gap-1 h-7 rounded bg-slate-950 border border-slate-800 px-2.5 text-[11px] font-bold text-rose-400 shadow-sm transition-all hover:bg-rose-500/10 hover:border-rose-500/30 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-800 disabled:hover:text-rose-400 disabled:cursor-not-allowed"
                        >
                          <XCircle size={12} />
                          <span>Reject</span>
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => onRevalidate(row)} 
                          className="inline-flex items-center gap-1 h-7 rounded bg-slate-950 border border-slate-800 px-2.5 text-[11px] font-bold text-amber-400 shadow-sm transition-all hover:bg-amber-500/10 hover:border-amber-500/30 active:scale-95"
                        >
                          <ShieldX size={12} />
                          <span>Revalidate</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}