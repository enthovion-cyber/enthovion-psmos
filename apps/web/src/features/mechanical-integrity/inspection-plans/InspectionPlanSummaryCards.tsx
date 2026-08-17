import type { MiInspectionPlanSummary } from '../types/inspection-plan.types';

export function InspectionPlanSummaryCards({ summary }: { summary?: MiInspectionPlanSummary | null | undefined }) {
  const cards = summary?.cards ?? [];
  if (!cards.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">Inspection plan summary is waiting for backend data.</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{card.label}</div>
          <div className="mt-2 text-2xl font-black text-[var(--psm-text)]">{card.value}</div>
          {card.hint ? <div className="mt-1 text-xs text-[var(--psm-muted)]">{card.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
