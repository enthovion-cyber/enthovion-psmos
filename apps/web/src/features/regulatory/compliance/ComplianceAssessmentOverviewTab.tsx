import { RegulatoryCard, RegulatoryMetricCard } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceDetail } from '../types/regulatory-compliance.types';
import { RegulatoryComplianceRollupPanel } from './RegulatoryComplianceRollupPanel';

export function ComplianceAssessmentOverviewTab({ detail }: { detail?: RegulatoryComplianceDetail | undefined }) {
  const cards = detail?.overview?.cards ?? {};
  return <div className="space-y-5"><div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">{Object.entries(cards).map(([key, value]) => <RegulatoryMetricCard key={key} label={key.replace(/([A-Z])/g, ' $1')} value={String(value ?? 'Not Set')} />)}</div><RegulatoryComplianceRollupPanel regulationId={detail?.assessment?.regulatory_item_id ?? null} /><RegulatoryCard title="Readiness / Missing Data">{detail?.readiness?.blockers?.length ? <div className="space-y-2">{detail.readiness.blockers.map((blocker) => <div key={blocker.key} className="rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><b>{blocker.blocking ? 'Blocking' : 'Warning'}:</b> {blocker.label}</div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No readiness blockers returned by backend.</p>}</RegulatoryCard></div>;
}
