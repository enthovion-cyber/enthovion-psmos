import type { ReactNode } from "react";
import { Filter, Plus } from "lucide-react";

export function HazopWorksheetToolbar({ query, riskFilter, lopaOnly, recommendationFilter, onQuery, onRiskFilter, onLopaOnly, onRecommendationFilter, onAddScenario, extra }: {
  query: string;
  riskFilter: string;
  lopaOnly: boolean;
  recommendationFilter: string;
  onQuery: (value: string) => void;
  onRiskFilter: (value: string) => void;
  onLopaOnly: (value: boolean) => void;
  onRecommendationFilter: (value: string) => void;
  onAddScenario: () => void;
  extra?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_160px_180px_auto_auto_auto]">
        <input className="input" placeholder="Search guideword, deviation, cause, consequence..." value={query} onChange={(event) => onQuery(event.target.value)} />
        <select className="input" value={riskFilter} onChange={(event) => onRiskFilter(event.target.value)}>{["All", "Critical", "High", "Medium", "Low"].map((risk) => <option key={risk}>{risk}</option>)}</select>
        <select className="input" value={recommendationFilter} onChange={(event) => onRecommendationFilter(event.target.value)}>{["All", "Required", "Open"].map((item) => <option key={item}>{item}</option>)}</select>
        <label className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 text-sm"><input type="checkbox" checked={lopaOnly} onChange={(event) => onLopaOnly(event.target.checked)} /> LOPA only</label>
        <button type="button" className="btn-primary" onClick={onAddScenario}><Plus size={14} /> Add Scenario</button>
        {extra}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--psm-muted)]"><Filter size={13} /> Filters apply to the selected node worksheet only.</div>
    </section>
  );
}
