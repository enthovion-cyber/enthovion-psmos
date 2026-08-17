import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import type { RegulatoryEvidenceLookups } from '../types/regulatory-evidence.types';

export function RegulatoryEvidenceFilters({ filters, setFilters, lookups, onRefresh }: { filters: Record<string, unknown>; setFilters: (filters: Record<string, unknown>) => void; lookups?: RegulatoryEvidenceLookups | undefined; onRefresh?: (() => void | Promise<unknown>) | undefined }) {
  const update = (key: string, value: string) => setFilters({ ...filters, page: 1, [key]: value || undefined });
  return (
    <RegulatoryCard title="Filters / Search" subtitle="Server-side evidence search, status, source, review, readiness, and restricted filters." action={<RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton>}>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <RegulatoryField label="Search"><input className={regulatoryInputClass()} value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} placeholder="Evidence code, title, source" /></RegulatoryField>
        <FilterSelect label="Evidence status" value={filters.evidenceStatus} options={lookups?.evidenceStatuses} onChange={(value) => update('evidenceStatus', value)} />
        <FilterSelect label="Review status" value={filters.reviewStatus} options={lookups?.evidenceReviewStatuses} onChange={(value) => update('reviewStatus', value)} />
        <FilterSelect label="Readiness" value={filters.readinessStatus} options={lookups?.evidenceReadinessStatuses} onChange={(value) => update('readinessStatus', value)} />
        <FilterSelect label="Evidence type" value={filters.evidenceType} options={lookups?.evidenceTypes} onChange={(value) => update('evidenceType', value)} />
        <FilterSelect label="Source module" value={filters.sourceModule} options={lookups?.evidenceSourceModules} onChange={(value) => update('sourceModule', value)} />
      </div>
    </RegulatoryCard>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: unknown; options?: string[] | undefined; onChange: (value: string) => void }) {
  return (
    <RegulatoryField label={label}>
      <select className={regulatoryInputClass()} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {(options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </RegulatoryField>
  );
}
