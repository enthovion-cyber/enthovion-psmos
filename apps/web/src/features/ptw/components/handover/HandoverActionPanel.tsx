import { AlertTriangle, CheckCircle2, FilePlus2, PauseCircle, Trash2 } from 'lucide-react';
import type { PermitShiftHandover } from '../../services/ptw-handover.service';

export function HandoverActionPanel({ handover, busy, completionBlockers = [], onCreate, onComplete, onSuspend, onDelete }: { handover?: PermitShiftHandover | null | undefined; busy?: boolean | undefined; completionBlockers?: string[]; onCreate: () => void; onComplete: () => void; onSuspend: () => void; onDelete: () => void }) {
  const completionBlocked = completionBlockers.length > 0;
  return (
    <section className="psm-card p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">Handover Actions</h3>
      {completionBlocked ? (
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
          <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={14} /> Completion blocked</div>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {completionBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="space-y-2">
        <button onClick={onCreate} disabled={busy} className="psm-button psm-button-primary w-full"><FilePlus2 size={15} /> Create Handover</button>
        <button onClick={onComplete} disabled={!handover || busy || handover.status === 'Completed' || completionBlocked} className="psm-button psm-button-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 size={15} /> Complete Handover</button>
        <button onClick={onSuspend} disabled={!handover || busy || handover.suspended_during_handover} className="psm-button psm-button-danger w-full disabled:opacity-60"><PauseCircle size={15} /> Suspend Permit During Handover</button>
        <button onClick={onDelete} disabled={!handover || busy || handover.status !== 'Draft'} className="psm-button psm-button-danger w-full disabled:opacity-60"><Trash2 size={15} /> Delete Draft</button>
      </div>
    </section>
  );
}
