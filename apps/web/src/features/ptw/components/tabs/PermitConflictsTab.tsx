'use client';

import { useState } from 'react';
import { History, ChevronDown, RefreshCcw } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { ConflictBlockerBanner } from '../conflicts/ConflictBlockerBanner';
import { ConflictDetailDrawer } from '../conflicts/ConflictDetailDrawer';
import { ConflictListTable } from '../conflicts/ConflictListTable';
import { ConflictMatrixPanel } from '../conflicts/ConflictMatrixPanel';
import { ConflictOverrideDialog } from '../conflicts/ConflictOverrideDialog';
import { ConflictSummaryCard } from '../conflicts/ConflictSummaryCard';
import { PermitConflictMapPanel } from '../conflicts/PermitConflictMapPanel';
import { RunConflictCheckPanel } from '../conflicts/RunConflictCheckPanel';
import { SIMOPSControlsTable } from '../conflicts/SIMOPSControlsTable';
import { SIMOPSReviewPanel } from '../conflicts/SIMOPSReviewPanel';
import { usePermitConflictHistory, usePermitConflictMap, usePermitConflictMatrix, usePermitConflictSummary, usePermitConflicts, usePermitSimops } from '../../hooks/usePermitConflicts';
import { usePermitConflictMutations } from '../../hooks/usePermitConflictMutations';
import type { PermitConflictRecord } from '../../services/ptw-conflict.service';

export function PermitConflictsTab({ permit }: { permit: any }) {
  const toast = useMutationToast();
  const conflicts = usePermitConflicts(permit.id);
  const summary = usePermitConflictSummary(permit.id);
  const simops = usePermitSimops(permit.id);
  const matrix = usePermitConflictMatrix();
  const map = usePermitConflictMap(permit.id);
  const history = usePermitConflictHistory(permit.id);
  const mutations = usePermitConflictMutations(permit.id);
  
  const [detail, setDetail] = useState<PermitConflictRecord | null>(null);
  const [override, setOverride] = useState<PermitConflictRecord | null>(null);
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);

  async function run(work: () => Promise<unknown>, success: string) {
    try { 
      await work(); 
      toast.success(success); 
    } catch (error) { 
      toast.error('Conflict action failed', error instanceof Error ? error.message : 'Request failed'); 
    }
  }

  // Handle data-driven sizing and filtering states for the history log array
  const historyEvents = history.data ?? [];
  const displayedHistory = showAllHistory ? historyEvents : historyEvents.slice(0, 3);
  const hasMoreThanThreeHistoryItems = historyEvents.length > 3;

  return (
    <div className="space-y-4 w-full text-slate-100">
      {/* Dynamic SIMOPS Notification & Structural KPI Summary Cards */}
      <ConflictBlockerBanner summary={summary.data} />
      <ConflictSummaryCard summary={summary.data} />

      {/* Main Structural Responsive Layout Frame */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4 items-start w-full">
        
        {/* Left Side Container: High-Priority Operations and Safety Evaluation Tables */}
        <div className="space-y-4 w-full min-w-0">
          
          <ConflictListTable 
            conflicts={conflicts.data} 
            onView={setDetail} 
            onOverride={setOverride} 
            onResolve={(row) => { 
              const notes = window.prompt('Resolution notes'); 
              if (notes) run(() => mutations.resolve.mutateAsync({ conflictId: row.id, notes }), 'Conflict resolved'); 
            }} 
            onFalsePositive={(row) => { 
              const notes = window.prompt('False positive reason'); 
              if (notes) run(() => mutations.falsePositive.mutateAsync({ conflictId: row.id, notes }), 'Conflict marked false positive'); 
            }} 
          />

          <SIMOPSReviewPanel 
            review={simops.data} 
            onSave={() => run(() => mutations.saveSimops.mutateAsync({ 
              simopsId: simops.data?.id, 
              input: { 
                simopsRequired: true, 
                coordinatorName: permit.area_authority_id ?? 'Area Authority', 
                concurrentWorkDescription: 'Concurrent work reviewed from active permit conflicts.', 
                interactionHazards: 'SIMOPS interaction hazards documented from conflict review.', 
                requiredControls: 'Control room coordination\nArea Authority review\nAffected permit holder communication', 
                comments: 'Created from Conflicts / SIMOPS tab' 
              } 
            }), 'SIMOPS review saved')} 
            onApprove={() => simops.data && run(() => mutations.approveSimops.mutateAsync(simops.data!.id), 'SIMOPS approved')} 
            onReject={() => { 
              if (!simops.data) return; 
              const reason = window.prompt('Reject reason'); 
              if (reason) run(() => mutations.rejectSimops.mutateAsync({ simopsId: simops.data!.id, reason }), 'SIMOPS rejected'); 
            }} 
            onAcknowledge={() => simops.data && run(() => mutations.acknowledgeControlRoom.mutateAsync(simops.data!.id), 'Control room acknowledged')} 
          />

          <SIMOPSControlsTable 
            controls={simops.data?.controls} 
            onAdd={() => simops.data && run(() => mutations.addControl.mutateAsync({ 
              simopsId: simops.data!.id, 
              input: { 
                controlDescription: 'Coordinate permit activities before work starts', 
                status: 'Open' 
              } 
            }), 'SIMOPS control added')} 
          />

          <ConflictMatrixPanel 
            rules={matrix.data} 
            onCreate={() => run(() => mutations.createMatrix.mutateAsync({ 
              permitTypeA: 'Hot Work', 
              permitTypeB: 'Confined Space', 
              conflictType: 'Hot Work Near Confined Space', 
              severity: 'Critical', 
              blockActivation: true, 
              overrideAllowed: true, 
              requiredControl: 'Area Authority SIMOPS approval and continuous gas monitoring' 
            }), 'Matrix rule created')} 
          />
        </div>

        {/* Right Side Container / Sidebar: Asynchronous Control Modules and Geolocation Panels */}
        <aside className="space-y-4 w-full min-w-0">
          
          <RunConflictCheckPanel 
            summary={summary.data} 
            running={mutations.runCheck.isPending} 
            onRun={() => run(() => mutations.runCheck.mutateAsync(), 'Conflict check completed')} 
          />

          <PermitConflictMapPanel map={map.data} />

          {/* Conflict History Section featuring adaptive visibility thresholds */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={16} className="text-sky-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Conflict History
                </h3>
              </div>
              <span className="rounded-full border border-slate-700/60 bg-slate-950 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                {historyEvents.length} logs
              </span>
            </div>

            {historyEvents.length ? (
              <div className="space-y-3">
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-md">
                  {displayedHistory.map((row) => (
                    <div 
                      key={row.id} 
                      className="rounded-lg border border-slate-800/60 bg-slate-950/40 p-3 transition-colors hover:bg-slate-950/80"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold text-xs text-slate-200 tracking-wide uppercase">
                          {row.event_type}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString()}
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-300 leading-relaxed font-normal">
                        {row.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Dynamic View All Toggle Trigger */}
                {hasMoreThanThreeHistoryItems && (
                  <div className="flex justify-center pt-2 border-t border-slate-800/40">
                    <button
                      type="button"
                      onClick={() => setShowAllHistory(!showAllHistory)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2 text-xs font-semibold tracking-wide text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 active:scale-98"
                    >
                      <span>{showAllHistory ? 'Show Less' : `View All History (${historyEvents.length})`}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 text-sky-400 ${showAllHistory ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center text-xs font-medium text-slate-500">
                No conflict logs or automated system checks executed yet.
              </div>
            )}
          </section>
        </aside>

      </div>

      {/* Global Interactive Context Overlay Drawers and Dialog Windows */}
      <ConflictDetailDrawer 
        conflict={detail} 
        onClose={() => setDetail(null)} 
      />

      <ConflictOverrideDialog 
        conflict={override} 
        onClose={() => setOverride(null)} 
        onRequest={(justification, requiredControls) => override && run(() => mutations.requestOverride.mutateAsync({ 
          conflictId: override.id, 
          input: { justification, requiredControls } 
        }), 'Override requested')} 
        onApprove={(signature, comment) => override && run(() => mutations.approveOverride.mutateAsync({ 
          conflictId: override.id, 
          input: { 
            justification: comment || 'Approved by Area Authority', 
            requiredControls: (override.required_controls ?? []).join('\n') || 'Controls verified', 
            signature, 
            comment 
          } 
        }), 'Override approved')} 
        onReject={(reason) => override && run(() => mutations.rejectOverride.mutateAsync({ 
          conflictId: override.id, 
          reason 
        }), 'Override rejected')} 
      />
    </div>
  );
}