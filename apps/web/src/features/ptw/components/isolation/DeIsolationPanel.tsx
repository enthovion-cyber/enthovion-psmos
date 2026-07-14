import { UnlockKeyhole } from 'lucide-react';
import type { PermitIsolationPoint, PermitIsolationSummary } from '../../services/ptw-isolation.service';

export function DeIsolationPanel({ points, summary, onStart }: { points: PermitIsolationPoint[]; summary?: PermitIsolationSummary | undefined; onStart: () => void }) {
  const removedLocks = points.filter((point) => point.deisolated_at).length;
  const removedBlinds = points.filter((point) => point.blind_spade_number && point.deisolated_at).length;
  const restoredValves = points.filter((point) => point.valve_tag && point.deisolated_at).length;
  const status = summary?.deIsolationPercent === 100 ? 'De-isolation complete' : summary?.deIsolationPercent ? 'De-isolation in progress' : 'De-isolation not started';
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-wide"><UnlockKeyhole size={17} />De-Isolation Workflow</div>
        <button disabled={!points.length || summary?.deIsolationPercent === 100} onClick={onStart} className="psm-button psm-button-secondary disabled:cursor-not-allowed disabled:opacity-45">Start De-Isolation</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Status" value={status} tone={summary?.deIsolationPercent === 100 ? 'text-success' : summary?.deIsolationPercent ? 'text-warning' : ''} />
        <Metric label="Removed Locks" value={`${removedLocks}/${points.length}`} />
        <Metric label="Removed Blinds/Spades" value={String(removedBlinds)} />
        <Metric label="Restored Valve Positions" value={String(restoredValves)} />
      </div>
      <div className="mt-4 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">
        De-isolation confirmation signature is captured when each point is de-isolated. Removal verification is captured separately where required.
      </div>
    </section>
  );
}

function Metric({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="text-xs uppercase text-[var(--psm-muted)]">{label}</div><div className={`mt-2 text-xl font-semibold ${tone}`}>{value}</div></div>;
}
