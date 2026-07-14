export function HazopOpenActionsBlockersCard({ recommendations }: { recommendations: any[] }) {
  const openActions = recommendations.filter((rec) => rec.action_id || rec.linked_action_id).filter((rec) => !["Closed", "Verified Closed", "Completed"].includes(rec.action_status_snapshot ?? rec.status)).length;
  const overdue = recommendations.filter((rec) => rec.due_date && new Date(rec.due_date) < new Date() && !["Closed", "Verified Closed"].includes(rec.status)).length;
  const blocked = recommendations.filter((rec) => rec.closure_blocker || rec.closureBlockerActive).length;
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="text-sm font-semibold">Open Actions / Blockers</h3><div className="mt-4 space-y-3 text-sm"><Row label="Open Actions" value={openActions} tone="text-red-300" /><Row label="Overdue Actions" value={overdue} tone="text-amber-300" /><Row label="Blocked Actions" value={blocked} tone="text-emerald-300" /></div></section>;
}
function Row({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="flex justify-between border-b border-[var(--psm-line)] pb-2"><span className="text-[var(--psm-muted)]">{label}</span><span className={tone}>{value}</span></div>; }
