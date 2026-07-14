import type { ReactNode } from "react";
import type { HazopNodeListItem } from "../../types/hazop-node.types";

export function HazopNodeCompletionCard({ node, scenarios }: { node: HazopNodeListItem; scenarios: any[] }) {
  const complete = node.completionPercent ?? 0;
  const closed = scenarios.filter((scenario) => ["Closed", "Completed", "Accepted"].includes(scenario.status)).length;
  return <Card title="Node Completion"><div className="flex items-center gap-5"><Ring value={complete} /><div className="flex-1 space-y-2 text-xs"><Line label="Scenarios reviewed" value={closed} total={scenarios.length} /><Line label="Safeguards reviewed" value={scenarios.filter((s) => s.existing_safeguards).length} total={scenarios.length} /><Line label="Recommendations" value={node.openRecommendationCount ?? 0} total={Math.max(node.openRecommendationCount ?? 0, 1)} /><Line label="Actions generated" value={scenarios.filter((s) => s.action_id || s.linked_action_id).length} total={scenarios.length || 1} /></div></div></Card>;
}

function Card({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4">{children}</div></section>; }
function Ring({ value }: { value: number }) { return <div className="grid h-20 w-20 place-items-center rounded-full border-8 border-primary/80 bg-primary/10 text-lg font-bold">{value}%</div>; }
function Line({ label, value, total }: { label: string; value: number; total: number }) { const pct = total ? Math.round((value / total) * 100) : 0; return <div><div className="flex justify-between"><span className="text-[var(--psm-muted)]">{label}</span><span>{value}/{total} · {pct}%</span></div><div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} /></div></div>; }
