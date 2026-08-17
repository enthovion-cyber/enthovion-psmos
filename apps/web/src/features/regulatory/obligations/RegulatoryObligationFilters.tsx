import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryObligationLookups } from '../hooks/useRegulatoryObligations';

export function RegulatoryObligationFilters({ filters, setFilters, loading }: { filters: Record<string, unknown>; setFilters: (filters: Record<string, unknown>) => void; loading?: boolean }) {
  const lookups = useRegulatoryObligationLookups();
  const update = (key: string, value: string) => setFilters({ ...filters, page: 1, [key]: value || undefined });
  const option = (value: string) => <option key={value} value={value}>{value}</option>;
  return (
    <RegulatoryCard title="Filters / Search" subtitle="Server-side search, filtering, sorting, and site-switcher-safe scope filters.">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <RegulatoryField label="Search"><input className={regulatoryInputClass()} value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} placeholder="Title, code, reference" /></RegulatoryField>
        <RegulatoryField label="Status"><select className={regulatoryInputClass()} value={String(filters.obligationStatus ?? '')} onChange={(event) => update('obligationStatus', event.target.value)}><option value="">All</option>{lookups.data?.obligationStatuses?.map(option)}</select></RegulatoryField>
        <RegulatoryField label="Applicability"><select className={regulatoryInputClass()} value={String(filters.applicabilityStatus ?? '')} onChange={(event) => update('applicabilityStatus', event.target.value)}><option value="">All</option>{['Inherited From Parent', 'Applicable', 'Partially Applicable', 'Not Applicable', 'Not Assessed', 'Stale Applicability'].map(option)}</select></RegulatoryField>
        <RegulatoryField label="Compliance"><select className={regulatoryInputClass()} value={String(filters.complianceStatus ?? '')} onChange={(event) => update('complianceStatus', event.target.value)}><option value="">All</option>{lookups.data?.complianceStatuses?.map(option)}</select></RegulatoryField>
        <RegulatoryField label="Criticality"><select className={regulatoryInputClass()} value={String(filters.criticality ?? '')} onChange={(event) => update('criticality', event.target.value)}><option value="">All</option>{lookups.data?.criticalityLevels?.map(option)}</select></RegulatoryField>
        <RegulatoryField label="Frequency"><select className={regulatoryInputClass()} value={String(filters.frequency ?? '')} onChange={(event) => update('frequency', event.target.value)}><option value="">All</option>{lookups.data?.obligationFrequencies?.map(option)}</select></RegulatoryField>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <RegulatoryButton variant="secondary" disabled={loading} onClick={() => setFilters({ page: 1, limit: 25, sort: 'updated_at.desc' })}>Reset Filters</RegulatoryButton>
        <RegulatoryButton href="/regulatory/obligations/missing-owner" variant="secondary">Missing Owner</RegulatoryButton>
        <RegulatoryButton href="/regulatory/obligations/missing-evidence" variant="secondary">Missing Evidence</RegulatoryButton>
        <RegulatoryButton href="/regulatory/obligations/stale" variant="secondary">Stale</RegulatoryButton>
      </div>
    </RegulatoryCard>
  );
}
