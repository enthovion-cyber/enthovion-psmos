import type { MiKpi } from '../types/equipment.types';

export function MiKpiCards({ cards }: { cards: MiKpi[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <a key={card.label} href={kpiHref(card.label)} className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${toneClass(card.tone)}`}>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold">{card.value}</div>
          <div className="mt-1 min-h-5 text-xs text-[var(--psm-muted)]">{card.helper ?? 'Backend scoped count'}</div>
        </a>
      ))}
    </section>
  );
}

function kpiHref(label: string) {
  const value = label.toLowerCase();
  if (value.includes('inspection')) return value.includes('record') || value.includes('failed') ? '/mechanical-integrity/inspections' : '/mechanical-integrity/inspection-plans';
  if (value.includes('pm') || value.includes('preventive')) return '/mechanical-integrity/preventive-maintenance';
  if (value.includes('calibration')) return '/mechanical-integrity/calibration';
  if (value.includes('psv') || value.includes('relief')) return '/mechanical-integrity/relief-devices';
  if (value.includes('sis') || value.includes('proof') || value.includes('safeguard') || value.includes('alarm') || value.includes('interlock')) return '/mechanical-integrity/sis';
  if (value.includes('bypass') || value.includes('impairment')) return '/mechanical-integrity/bypass-impairments';
  if (value.includes('deficien')) return '/mechanical-integrity/deficiencies';
  if (value.includes('deviation')) return '/mechanical-integrity/deviations';
  if (value.includes('work order') || value.includes('verification')) return '/mechanical-integrity/work-orders';
  if (value.includes('readiness') || value.includes('startup')) return '/mechanical-integrity/readiness';
  if (value.includes('document') || value.includes('certificate')) return '/mechanical-integrity/documents';
  if (value.includes('report')) return '/mechanical-integrity/reports';
  if (value.includes('export')) return '/mechanical-integrity/export';
  return `/mechanical-integrity/equipment?q=${encodeURIComponent(label)}`;
}

function toneClass(tone?: string) {
  if (tone === 'danger') return 'border-danger/30 bg-danger/5';
  if (tone === 'warning') return 'border-warning/30 bg-warning/5';
  return 'border-[var(--psm-line)] bg-[var(--psm-surface)]';
}
