'use client';

import { RegulatoryButton, RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';

export function RegulatoryAuditMappingFilters({ search, setSearch, onRefresh }: { search: string; setSearch: (value: string) => void; onRefresh?: () => void }) {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-[1fr_auto]">
      <RegulatoryField label="Search audit mappings" helper="Search mapping code, title, rationale, source, and target metadata from the backend register.">
        <input className={regulatoryInputClass()} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search mapping code, obligation, audit checklist, evidence, finding, CAPA, score..." />
      </RegulatoryField>
      <div className="flex items-end"><RegulatoryButton variant="secondary" onClick={onRefresh}>Refresh</RegulatoryButton></div>
    </div>
  );
}
