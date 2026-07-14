import type { HazopClosureBlocker } from '../../types/hazop-review.types';
import { Panel } from './HazopReadinessChecklist';

export function HazopClosureBlockersPanel({ blockers }: { blockers: HazopClosureBlocker[] }) {
  return <Panel title="Closure Blockers">{blockers.map((blocker, index) => <div key={blocker.id ?? index} className="mb-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm"><div className="font-semibold text-red-200">{blocker.blocker_title}</div><p className="mt-1 text-[var(--psm-muted)]">{blocker.blocker_description}</p></div>)}{!blockers.length ? <p className="text-sm text-[var(--psm-muted)]">No hard blockers currently prevent approval or closure.</p> : null}</Panel>;
}
