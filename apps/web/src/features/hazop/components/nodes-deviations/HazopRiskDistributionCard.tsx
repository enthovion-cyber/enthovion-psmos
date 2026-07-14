import { RiskBadge } from "../shared/HazopBadges";

export function HazopRiskDistributionCard({ scenarios }: { scenarios: any[] }) {
  const levels = ["Critical", "High", "Medium", "Low"];
  const total = scenarios.length || 1;
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h3 className="text-sm font-semibold">Initial Risk Distribution</h3><div className="mt-4 flex items-center gap-5"><div className="h-20 w-20 rounded-full border-[14px] border-red-500/80 border-b-amber-400 border-l-emerald-400 border-r-orange-500" /><div className="flex-1 space-y-2 text-xs">{levels.map((level) => { const count = scenarios.filter((s) => s.risk_level === level).length; return <div key={level} className="flex items-center justify-between"><RiskBadge value={level} /><span>{count} ({Math.round((count / total) * 100)}%)</span></div>; })}<div className="pt-2 text-[var(--psm-muted)]">Total Scenarios: {scenarios.length}</div></div></div></section>;
}
