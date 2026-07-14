import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { HazopLinkedRecordBlocker } from '../../types/hazop-linked-record.types';

export function HazopLinkedRecordBlockerPanel({ blockers, onResolve }: { blockers: HazopLinkedRecordBlocker[]; onResolve?: (blocker: HazopLinkedRecordBlocker) => void }) {
  return <Panel title="Dependency / Blockers" icon={<ShieldAlert size={16} />}><div className="space-y-2">{blockers.map((blocker) => <div key={blocker.id} className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-red-200">{blocker.blocker_type}</span>{blocker.status === 'Open' && onResolve ? <button onClick={() => onResolve(blocker)} className="text-xs text-primary">Resolve</button> : null}</div><p className="mt-1 text-[var(--psm-muted)]">{blocker.blocker_description}</p></div>)}{!blockers.length ? <p className="text-sm text-[var(--psm-muted)]">No linked-record blockers are open.</p> : null}</div></Panel>;
}

export function Panel({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="mb-3 flex items-center gap-2 font-semibold">{icon}{title}</div>{children}</section>;
}
