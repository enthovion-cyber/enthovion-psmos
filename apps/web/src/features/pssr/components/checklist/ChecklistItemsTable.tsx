'use client';

import { Eye, FileUp, ShieldCheck, XCircle } from 'lucide-react';
import { Badge, PSSRCard } from '../pssr-ui';

export function ChecklistItemsTable({
  items,
  onSelect,
  onComplete,
  onEvidence,
  onVerify,
  onFail
}: {
  items: any[];
  onSelect: (item: any) => void;
  onComplete: (item: any) => void;
  onEvidence: (item: any) => void;
  onVerify: (item: any) => void;
  onFail: (item: any) => void;
}) {
  return (
    <PSSRCard title="Required Checklist Registry">
      {/* 
        Responsive Data Container: Protects table layout bounds 
        while offering side-scrolling on compact viewports 
      */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/40">
        <table className="min-w-[1300px] w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
              <th className="px-4 py-3.5 min-w-[280px]">Requirement Details</th>
              <th className="px-3 py-3.5">Required</th>
              <th className="px-3 py-3.5">Pre-Startup</th>
              <th className="px-4 py-3.5">Owner / Due Date</th>
              <th className="px-3 py-3.5">Item Status</th>
              <th className="px-3 py-3.5">Evidence Track</th>
              <th className="px-3 py-3.5">Verification</th>
              <th className="px-4 py-3.5">Origin Source</th>
              <th className="px-4 py-3.5 text-right">Operations Grid</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-white/5">
            {items.map((item) => {
              // Status Badge Determinations from original logic
              const isStatusSettled = ['Completed', 'Verified', 'Waived', 'Not Applicable'].includes(item.status);
              const isStatusFailed = item.status === 'Failed';

              // Evidence Badge Logic
              const isEvidenceAlert = item.evidence_required && !['Uploaded', 'Accepted'].includes(item.evidence_status);
              const evidenceTone = isEvidenceAlert ? 'red' : item.evidence_required ? 'green' : 'slate';

              // Verification Badge Logic
              const isVerificationAlert = item.verification_required && item.verification_status !== 'Verified';
              const verificationTone = isVerificationAlert ? 'amber' : item.verification_required ? 'green' : 'slate';

              // Source Context Label
              const sourceContextLabel = item.related_moc_id 
                ? 'MOC' 
                : item.related_equipment_id 
                ? 'Equipment' 
                : item.related_document_id 
                ? 'Document' 
                : 'PSSR';

              return (
                <tr 
                  key={item.id} 
                  className="group align-top transition-colors duration-150 hover:bg-slate-900/30"
                >
                  {/* Requirement Title and Blockers */}
                  <td className="px-4 py-4">
                    <button 
                      type="button" 
                      onClick={() => onSelect(item)} 
                      className="text-left font-bold text-white hover:text-cyan-400 focus:outline-none transition-colors leading-snug"
                    >
                      {item.item_title}
                    </button>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {item.item_description ?? 'No description recorded.'}
                    </p>
                    {item.startup_blocking && (
                      <div className="mt-2.5">
                        <Badge tone="red">Startup blocker if incomplete</Badge>
                      </div>
                    )}
                  </td>

                  {/* Required Column */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    {item.required ? <Badge tone="red">Yes</Badge> : <Badge tone="slate">No</Badge>}
                  </td>

                  {/* Before Startup Column */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    {item.required_before_startup ? <Badge tone="amber">Yes</Badge> : <Badge tone="slate">No</Badge>}
                  </td>

                  {/* Owner & Due Date */}
                  <td className="px-4 py-4 text-xs text-slate-300 space-y-1">
                    <div className="font-medium truncate max-w-[120px]">
                      {item.owner_id ?? item.owner_role_id ?? (
                        <span className="text-slate-600 italic">Unassigned</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </td>

                  {/* Item Status */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Badge tone={isStatusSettled ? 'green' : isStatusFailed ? 'red' : 'amber'}>
                      {item.status}
                    </Badge>
                  </td>

                  {/* Evidence Status */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Badge tone={evidenceTone}>
                      {item.evidence_required ? item.evidence_status : 'Not Required'}
                    </Badge>
                  </td>

                  {/* Verification Status */}
                  <td className="px-3 py-4 whitespace-nowrap">
                    <Badge tone={verificationTone}>
                      {item.verification_required ? item.verification_status : 'Not Required'}
                    </Badge>
                  </td>

                  {/* Source Log Column */}
                  <td className="px-4 py-4 text-xs text-slate-300 space-y-1">
                    <div className="font-medium truncate max-w-[140px]">{item.source}</div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                      {sourceContextLabel}
                    </p>
                  </td>

                  {/* Actions Column */}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* View Action */}
                      <button 
                        type="button" 
                        onClick={() => onSelect(item)} 
                        title="View Details"
                        className="rounded-lg border border-white/10 bg-slate-900 p-2 text-slate-400 hover:border-white/20 hover:text-white transition-all active:scale-90"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Complete Action */}
                      <button 
                        type="button" 
                        onClick={() => onComplete(item)} 
                        title="Mark Complete"
                        className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-200 transition-all active:scale-90"
                      >
                        <ShieldCheck size={14} />
                      </button>

                      {/* Evidence Action */}
                      <button 
                        type="button" 
                        onClick={() => onEvidence(item)} 
                        title="Upload Evidence Artifact"
                        className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2 text-blue-400 hover:bg-blue-500/20 hover:text-blue-200 transition-all active:scale-90"
                      >
                        <FileUp size={14} />
                      </button>

                      {/* Verify Action */}
                      <button 
                        type="button" 
                        onClick={() => onVerify(item)} 
                        title="Verify Item"
                        className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-2 text-purple-400 hover:bg-purple-500/20 hover:text-purple-200 transition-all active:scale-90"
                      >
                        <ShieldCheck size={14} />
                      </button>

                      {/* Fail Action */}
                      <button 
                        type="button" 
                        onClick={() => onFail(item)} 
                        title="Mark Deficient / Failed"
                        className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 hover:bg-red-500/20 hover:text-red-200 transition-all active:scale-90"
                      >
                        <XCircle size={14} />
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