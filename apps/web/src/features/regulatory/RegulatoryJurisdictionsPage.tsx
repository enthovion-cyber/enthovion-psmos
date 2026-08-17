'use client';

import { useState } from 'react';
import { RegulatoryHeader } from './RegulatoryHeader';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryField, RegulatoryLoadingState, regulatoryInputClass, formatRegulatoryError } from './shared/RegulatoryUi';
import { useRegulatoryJurisdictionMutations, useRegulatoryJurisdictions } from './hooks/useRegulatoryJurisdictions';
import { useRegulatoryLookups } from './hooks/useRegulatoryLookups';

export function RegulatoryJurisdictionsPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [form, setForm] = useState<Record<string, unknown>>({});
  const query = useRegulatoryJurisdictions(filters);
  const lookups = useRegulatoryLookups();
  const mutations = useRegulatoryJurisdictionMutations();

  async function save() {
    try {
      await mutations.create.mutateAsync(form);
      setForm({});
    } catch (error) {
      window.alert(formatRegulatoryError(error));
    }
  }

  if (query.isLoading) return <RegulatoryLayout current="Jurisdictions"><RegulatoryLoadingState rows={6} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Jurisdictions"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Jurisdictions">
      <div className="space-y-5">
        <RegulatoryHeader title="Jurisdiction / Authority Library" subtitle="Phase 1 jurisdiction foundation with company/site-isolated backend records." onRefresh={() => query.refetch()} />
        <RegulatoryCard title="Add Jurisdiction" subtitle="Creates a real jurisdiction record and regulatory history event.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <RegulatoryField label="Jurisdiction level"><select className={regulatoryInputClass()} value={String(form.jurisdiction_level ?? '')} onChange={(event) => setForm({ ...form, jurisdiction_level: event.target.value })}><option value="">Select</option>{lookups.data?.jurisdictionLevels.map((level) => <option key={level}>{level}</option>)}</select></RegulatoryField>
            <RegulatoryField label="Authority name"><input className={regulatoryInputClass()} value={String(form.authority_name ?? '')} onChange={(event) => setForm({ ...form, authority_name: event.target.value })} /></RegulatoryField>
            <RegulatoryField label="Country"><input className={regulatoryInputClass()} value={String(form.country ?? '')} onChange={(event) => setForm({ ...form, country: event.target.value })} /></RegulatoryField>
            <RegulatoryField label="State / province"><input className={regulatoryInputClass()} value={String(form.state_province ?? '')} onChange={(event) => setForm({ ...form, state_province: event.target.value })} /></RegulatoryField>
          </div>
          <div className="mt-4"><RegulatoryButton disabled={mutations.create.isPending || !form.jurisdiction_level || !form.authority_name} title={!form.jurisdiction_level || !form.authority_name ? 'Jurisdiction level and authority name are required.' : 'Create jurisdiction.'} onClick={() => void save()}>{mutations.create.isPending ? 'Saving...' : 'Create Jurisdiction'}</RegulatoryButton></div>
        </RegulatoryCard>
        <RegulatoryCard title="Jurisdictions" subtitle="Real jurisdiction records returned by the backend.">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <input className={regulatoryInputClass()} placeholder="Search authority/country" value={String(filters.search ?? '')} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
          </div>
          {query.data?.rows?.length ? <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="text-[var(--psm-muted)]"><tr><th className="p-2">Level</th><th className="p-2">Authority</th><th className="p-2">Country</th><th className="p-2">State</th><th className="p-2">Status</th></tr></thead><tbody>{query.data.rows.map((row, index) => <tr key={String(row.id ?? index)} className="border-t border-[var(--psm-line)]"><td className="p-2">{String(row.jurisdiction_level ?? '-')}</td><td className="p-2">{String(row.authority_name ?? '-')}</td><td className="p-2">{String(row.country ?? '-')}</td><td className="p-2">{String(row.state_province ?? '-')}</td><td className="p-2">{String(row.status ?? '-')}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[var(--psm-muted)]">No jurisdictions found for this company/site scope.</p>}
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
