import type { RegulatoryDetail } from '../types/regulatory.types';
import { RegulatoryMetricCard, RegulatoryCard } from '../shared/RegulatoryUi';

export function RegulatoryOverviewTab({ detail }: { detail?: RegulatoryDetail | undefined }) {
  const item = detail?.item;
  const cards = detail?.overviewCards ?? {};
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(cards).map(([label, value]) => <RegulatoryMetricCard key={label} label={label.replace(/([A-Z])/g, ' $1')} value={String(value ?? '-')} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <RegulatoryCard title="Requirement Identity" subtitle="Core metadata from the register item.">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <Data label="Source type" value={item?.source_type} />
            <Data label="Source reference" value={item?.source_reference_number} />
            <Data label="Authority" value={item?.authority_name} />
            <Data label="Jurisdiction" value={item?.jurisdiction_level} />
            <Data label="Category" value={item?.category} />
            <Data label="Topic" value={item?.topic} />
            <Data label="Effective date" value={item?.effective_date} />
            <Data label="Next review date" value={item?.next_review_date} />
          </dl>
        </RegulatoryCard>
        <RegulatoryCard title="Foundation Readiness" subtitle="Backend-generated readiness signals for Phase 1.">
          <div className="space-y-3 text-sm">
            <Readiness label="Owner assigned" ok={Boolean(item?.owner_user_id)} />
            <Readiness label="Applicability assessed" ok={item?.applicability_status !== 'Not Assessed'} />
            <Readiness label="Compliance status assessed" ok={item?.compliance_status !== 'Not Assessed'} />
            <Readiness label="Evidence linked or summarized" ok={Boolean(item?.linked_evidence_count || item?.evidence_summary_foundation)} />
            <Readiness label="Review date configured" ok={Boolean(item?.next_review_date)} />
          </div>
        </RegulatoryCard>
      </div>
    </div>
  );
}

function Data({ label, value }: { label: string; value?: unknown | undefined }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--psm-muted)]">{label}</dt><dd className="mt-1 font-medium text-[var(--psm-fg)]">{String(value ?? '-')}</dd></div>;
}

function Readiness({ label, ok }: { label: string; ok: boolean }) {
  return <div className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2"><span>{label}</span><b className={ok ? 'text-emerald-600' : 'text-amber-600'}>{ok ? 'Complete' : 'Missing'}</b></div>;
}
