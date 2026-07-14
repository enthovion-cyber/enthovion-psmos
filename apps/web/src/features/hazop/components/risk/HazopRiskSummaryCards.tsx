import { AlertTriangle, FileCheck2, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

export function HazopRiskSummaryCards({ summary, loading }: { summary: any; loading: boolean }) {
  const cards = [
    { label: 'Total Scenarios', value: summary?.totalScenarios ?? 0, icon: SlidersHorizontal, tone: 'text-sky-300' },
    { label: 'High / Critical Open', value: summary?.highCriticalOpen ?? 0, icon: AlertTriangle, tone: 'text-orange-300' },
    { label: 'LOPA Required', value: summary?.lopaRequired ?? 0, icon: ShieldAlert, tone: 'text-red-300' },
    { label: 'Risk Acceptances', value: summary?.activeAcceptances ?? 0, icon: FileCheck2, tone: 'text-emerald-300' }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <section key={card.label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--psm-muted)]"><span>{card.label}</span><card.icon size={17} /></div>
          <div className={cn('mt-3 text-3xl font-semibold', card.tone)}>{loading ? '...' : card.value}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]">
            <span>Low {summary?.low ?? 0}</span><span>Medium {summary?.medium ?? 0}</span><span>High {summary?.high ?? 0}</span><span>Critical {summary?.critical ?? 0}</span>
          </div>
        </section>
      ))}
    </div>
  );
}
