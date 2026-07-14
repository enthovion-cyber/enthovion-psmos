'use client';

import { ExternalLink, LinkIcon, ShieldCheck, Unlink, XCircle } from 'lucide-react';
import { Badge, PSSRCard } from '../pssr-ui';

export function ControlledDocumentsTable({ 
  readiness, 
  onLink, 
  onUnlink, 
  onRevision, 
  onJustify, 
  onVerify, 
  onReject 
}: { 
  readiness: any[]; 
  onLink: (row: any) => void; 
  onUnlink: (row: any) => void; 
  onRevision: (row: any) => void; 
  onJustify: (row: any) => void; 
  onVerify: (row: any) => void; 
  onReject: (row: any) => void 
}) {
  return (
    <PSSRCard title="Controlled Documents Registry">
      {/* 
        Responsive Wrapper: Allows horizontal scroll on tiny screens 
        while preserving density layout integrity 
      */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
        <table className="min-w-[1200px] w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
              <th className="px-4 py-3.5">Document Details</th>
              <th className="px-4 py-3.5">Doc Number</th>
              <th className="px-4 py-3.5">Version Lifecycle</th>
              <th className="px-4 py-3.5">System Status</th>
              <th className="px-4 py-3.5">Readiness</th>
              <th className="px-4 py-3.5">Impact Level</th>
              <th className="px-4 py-3.5 max-w-[200px]">Justification Log</th>
              <th className="px-4 py-3.5 text-right">Operations Grid</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-white/5">
            {readiness.map((row) => {
              // Status Parsing Rules
              const isStatusApproved = ['Current', 'Approved', 'Justified Not Required'].includes(row.status);
              const isStatusMissing = row.status === 'Missing';

              return (
                <tr 
                  key={row.id} 
                  className="group align-top transition-colors duration-150 hover:bg-slate-900/30"
                >
                  {/* Document Title Column */}
                  <td className="px-4 py-4 min-w-[220px]">
                    <p className="font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                      {row.document_title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${row.controlled_document_id ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      {row.controlled_document_id ? 'Linked from Document Control' : 'Not linked'}
                    </p>
                  </td>

                  {/* Document Number Column */}
                  <td className="px-4 py-4 font-mono text-xs text-slate-300">
                    {row.document_number ?? (
                      <span className="text-slate-600 italic">None</span>
                    )}
                  </td>

                  {/* Versions Column */}
                  <td className="px-4 py-4 space-y-1 text-xs text-slate-300">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">Curr:</span>
                      <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-white/5">{row.current_version ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span>Req:</span>
                      <span className="font-mono">{row.required_version ?? '-'}</span>
                    </div>
                  </td>

                  {/* Status Badge Column */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge tone={isStatusApproved ? 'green' : isStatusMissing ? 'red' : 'amber'}>
                      {row.status}
                    </Badge>
                  </td>

                  {/* Readiness Badge Column */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge tone={row.readiness_status === 'Ready' ? 'green' : row.readiness_status === 'Blocked' ? 'red' : 'amber'}>
                      {row.readiness_status}
                    </Badge>
                  </td>

                  {/* Startup Blocking Status Column */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {row.startup_blocking ? (
                      <Badge tone="red">Blocks Startup</Badge>
                    ) : (
                      <Badge tone="slate">Non-blocking</Badge>
                    )}
                  </td>

                  {/* Justification Field Column */}
                  <td className="px-4 py-4 text-xs text-slate-400 max-w-[200px] break-words leading-relaxed">
                    {row.justification ?? (
                      <span className="text-slate-600 italic">No historical text logged</span>
                    )}
                  </td>

                  {/* Interactive Button Group Grid Column */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Link Action */}
                      <button 
                        onClick={() => onLink(row)} 
                        title="Link Document"
                        className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2 text-blue-400 hover:bg-blue-500/20 hover:text-blue-200 transition-all active:scale-90"
                      >
                        <LinkIcon size={14} />
                      </button>

                      {/* Unlink Action (Conditional) */}
                      {row.controlled_document_id ? (
                        <button 
                          onClick={() => onUnlink(row)} 
                          title="Remove Link Attachment"
                          className="rounded-lg border border-white/10 bg-slate-900 p-2 text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90"
                        >
                          <Unlink size={14} />
                        </button>
                      ) : null}

                      {/* Verify Action */}
                      <button 
                        onClick={() => onVerify(row)} 
                        title="Verify Record"
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-200 transition-all active:scale-90"
                      >
                        <ShieldCheck size={14} />
                      </button>

                      {/* Reject Action */}
                      <button 
                        onClick={() => onReject(row)} 
                        title="Reject Changes"
                        className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 hover:bg-red-500/20 hover:text-red-200 transition-all active:scale-90"
                      >
                        <XCircle size={14} />
                      </button>

                      {/* External Revision Link Action */}
                      <button 
                        onClick={() => onRevision(row)} 
                        title="Open External Source Revision"
                        className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-amber-400 hover:bg-amber-500/20 hover:text-amber-200 transition-all active:scale-90"
                      >
                        <ExternalLink size={14} />
                      </button>

                      {/* Justify Explicit Action Callout Button */}
                      <button 
                        onClick={() => onJustify(row)} 
                        className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all active:scale-95"
                      >
                        Justify
                      </button>

                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PSSRCard>
  );
}