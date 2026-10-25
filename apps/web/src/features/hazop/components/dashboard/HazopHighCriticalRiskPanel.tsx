import Link from 'next/link';
import { HazopDashboardRiskBadge } from './HazopDashboardRiskBadge';

export function HazopHighCriticalRiskPanel({ scenarios }: { scenarios: any[] }) {
  return (
    <section className="h-[270px] flex flex-col justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4 shadow-sm">
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="mb-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-[var(--psm-text)]">High / Critical Risks</h3>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {scenarios.length}
            </span>
          </div>
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</span>
        </div>
        <div className="space-y-2 overflow-y-auto scrollbar-thin pr-1 flex-1">
          {scenarios.slice(0, 6).map((scenario) => (
            <Link 
              href={`/hazop/${scenario.study_id}`} 
              key={scenario.id} 
              className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5 hover:bg-[var(--psm-surface-2)] transition"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--psm-text)] truncate">
                  {scenario.study?.study_number ?? scenario.scenario_number}
                </span>
                <HazopDashboardRiskBadge value={scenario.risk_level} />
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] text-[var(--psm-muted)] leading-relaxed">
                {scenario.deviation_text ?? scenario.consequence ?? scenario.cause ?? 'Process deviation requiring barrier evaluation'}
              </p>
            </Link>
          ))}
          {!scenarios.length && <Empty text="No open high or critical scenarios." />}
        </div>
      </div>
      <div className="pt-2 text-[10px] text-[var(--psm-muted)] border-t border-[var(--psm-line)] shrink-0">
        Requires quantitative IPL evaluation
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-xs text-[var(--psm-muted)]">
      {text}
    </div>
  );
}
