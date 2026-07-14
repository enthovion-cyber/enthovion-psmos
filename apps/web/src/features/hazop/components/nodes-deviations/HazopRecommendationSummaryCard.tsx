export function HazopRecommendationSummaryCard({ recommendations, onOpen }: { recommendations: any[]; onOpen?: () => void }) {
  const open = recommendations.filter((r) => !["Closed", "Cancelled", "Verified Closed"].includes(r.status)).length;
  const inProgress = recommendations.filter((r) => ["In Progress", "Pending Evidence", "Pending Verification"].includes(r.status)).length;
  const closed = recommendations.filter((r) => ["Closed", "Verified Closed"].includes(r.status)).length;
  const total = recommendations.length || 1;
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="text-sm font-semibold">Recommendation Summary</h3><div className="mt-4 space-y-2 text-sm"><Row label="Total Recommendations" value={recommendations.length} /><Row label="Open" value={open} tone="text-red-300" /><Row label="In Progress" value={inProgress} tone="text-blue-300" /><Row label="Closed" value={closed} tone="text-emerald-300" /><div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.round((closed / total) * 100)}%` }} /></div><button className="mt-2 text-xs text-primary" onClick={onOpen}>View all recommendations</button></div></section>;
}
function Row({ label, value, tone = "" }: { label: string; value: number; tone?: string }) { return <div className="flex justify-between"><span className="text-[var(--psm-muted)]">{label}</span><span className={tone}>{value}</span></div>; }
