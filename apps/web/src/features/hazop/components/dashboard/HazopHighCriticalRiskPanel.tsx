import Link from 'next/link';
import { HazopDashboardRiskBadge } from './HazopDashboardRiskBadge';

export function HazopHighCriticalRiskPanel({ scenarios }: { scenarios: any[] }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">High / Critical Risk Studies</h3><span className="text-xs text-blue-300">View all</span></div>
      <div className="space-y-2">
        {scenarios.slice(0, 6).map((scenario) => (
          <Link href={`/hazop/${scenario.study_id}`} key={scenario.id} className="block rounded-lg border border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]">
            <div className="flex items-center justify-between gap-3"><span className="font-semibold">{scenario.study?.study_number ?? scenario.scenario_number}</span><HazopDashboardRiskBadge value={scenario.risk_level} /></div>
            <p className="mt-2 line-clamp-2 text-xs text-[var(--psm-muted)]">{scenario.deviation_text ?? scenario.consequence ?? scenario.cause}</p>
          </Link>
        ))}
        {!scenarios.length ? <Empty text="No open high or critical scenarios." /> : null}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-center text-sm text-[var(--psm-muted)]">{text}</div>;
}
