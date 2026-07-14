import type { IncidentOverviewSummaryCard } from '../../types/incident-overview.types';
import { toneClass } from './OverviewPanelShell';

export function OverviewSummaryCards({ cards = [] }: { cards?: IncidentOverviewSummaryCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => (
        <div key={card.label} title={card.help} className={`rounded-xl border p-3 ${toneClass(card.tone)}`}>
          <div className="text-[10px] uppercase tracking-wide opacity-70">{card.label}</div>
          <div className="mt-2 text-lg font-black">{String(card.value ?? '-')}</div>
          <div className="mt-1 text-[11px] opacity-70">{card.help}</div>
        </div>
      ))}
    </div>
  );
}
