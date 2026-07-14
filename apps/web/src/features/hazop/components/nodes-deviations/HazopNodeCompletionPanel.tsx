import type { HazopNodeListItem } from "../../types/hazop-node.types";

export function HazopNodeCompletionPanel({ node }: { node: HazopNodeListItem }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="text-sm font-semibold">Node Completion</div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${node.completionPercent ?? 0}%` }} /></div><div className="mt-2 text-xs text-[var(--psm-muted)]">{node.completionPercent ?? 0}% complete</div></div>;
}
