import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from './shared/RegulatoryUi';

const filterFields: Array<[string, string]> = [
  ['search', 'Search by title/code/reference'],
  ['jurisdictionLevel', 'Jurisdiction'],
  ['country', 'Country'],
  ['stateProvince', 'State/province'],
  ['authorityName', 'Authority / issuing body'],
  ['sourceType', 'Source type'],
  ['category', 'Category'],
  ['topic', 'Topic'],
  ['siteId', 'Site'],
  ['unitId', 'Unit'],
  ['areaId', 'Area'],
  ['equipmentId', 'Equipment'],
  ['applicabilityStatus', 'Applicability status'],
  ['complianceStatus', 'Compliance status'],
  ['registerStatus', 'Register status'],
  ['criticality', 'Criticality'],
  ['ownerUserId', 'Owner'],
  ['reviewerUserId', 'Reviewer'],
  ['reviewDueFrom', 'Review due from'],
  ['reviewDueTo', 'Review due to']
];

export function RegulatoryRegisterFilters({ filters, setFilters, loading }: { filters: Record<string, unknown>; setFilters: (filters: Record<string, unknown>) => void; loading?: boolean | undefined }) {
  return (
    <RegulatoryCard title="Advanced Filters / Search" subtitle="Server-side filters are submitted to the backend register API.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filterFields.map(([key, label]) => <RegulatoryField key={key} label={label}><input className={regulatoryInputClass()} value={String(filters[key] ?? '')} onChange={(event) => setFilters({ ...filters, [key]: event.target.value, page: 1 })} /></RegulatoryField>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <RegulatoryButton variant="secondary" disabled={loading} title={loading ? 'Register is loading.' : 'Refresh with current filters.'} onClick={() => setFilters({ ...filters })}>Apply Filters</RegulatoryButton>
        <RegulatoryButton variant="secondary" onClick={() => setFilters({ page: 1, limit: filters.limit ?? 25, sort: 'updated_at.desc' })}>Clear</RegulatoryButton>
      </div>
    </RegulatoryCard>
  );
}
