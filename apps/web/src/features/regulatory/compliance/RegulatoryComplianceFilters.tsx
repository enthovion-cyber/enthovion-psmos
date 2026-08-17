import { RegulatoryButton, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceLookups } from '../types/regulatory-compliance.types';

export function RegulatoryComplianceFilters({ filters, setFilters, lookups, onRefresh }: { filters: Record<string, unknown>; setFilters: (filters: Record<string, unknown>) => void; lookups?: RegulatoryComplianceLookups | undefined; onRefresh?: (() => void) | undefined }) {
  const update = (key: string, value: string) => setFilters({ ...filters, [key]: value || undefined, page: 1 });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <RegulatoryField label="Search"><input className={regulatoryInputClass()} value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} placeholder="Assessment, source, obligation" /></RegulatoryField>
      <RegulatoryField label="Compliance status"><select className={regulatoryInputClass()} value={String(filters.complianceStatus ?? '')} onChange={(event) => update('complianceStatus', event.target.value)}><option value="">All statuses</option>{lookups?.complianceStatuses?.map((value) => <option key={value}>{value}</option>)}</select></RegulatoryField>
      <RegulatoryField label="Evidence readiness"><select className={regulatoryInputClass()} value={String(filters.evidenceReadinessStatus ?? '')} onChange={(event) => update('evidenceReadinessStatus', event.target.value)}><option value="">All readiness</option>{lookups?.complianceEvidenceReadinessStatuses?.map((value) => <option key={value}>{value}</option>)}</select></RegulatoryField>
      <div className="flex items-end gap-2"><RegulatoryButton variant="secondary" onClick={() => setFilters({ page: 1, limit: 25 })}>Clear</RegulatoryButton><RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton></div>
    </div>
  );
}
