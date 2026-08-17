'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RegulatoryItem } from './types/regulatory.types';
import { RegulatoryHeader } from './RegulatoryHeader';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState, formatRegulatoryError } from './shared/RegulatoryUi';
import { useRegulatoryLookups } from './hooks/useRegulatoryLookups';
import { useRegulatoryItemMutations } from './hooks/useRegulatoryItemMutations';
import { RegulatoryIdentitySection } from './sections/RegulatoryIdentitySection';
import { RegulatoryJurisdictionSection } from './sections/RegulatoryJurisdictionSection';
import { RegulatoryScopeApplicabilitySection } from './sections/RegulatoryScopeApplicabilitySection';
import { RegulatoryCategoryCriticalitySection } from './sections/RegulatoryCategoryCriticalitySection';
import { RegulatoryOwnershipReviewSection } from './sections/RegulatoryOwnershipReviewSection';
import { RegulatoryComplianceStatusSection } from './sections/RegulatoryComplianceStatusSection';
import { RegulatoryLinksFoundationSection } from './sections/RegulatoryLinksFoundationSection';

const requiredFields = ['requirement_title', 'source_type', 'jurisdiction_level', 'category', 'criticality'];

function initialForm(item?: RegulatoryItem | undefined): Record<string, unknown> {
  return {
    register_status: item?.register_status ?? 'Draft',
    applicability_status: item?.applicability_status ?? 'Not Assessed',
    compliance_status: item?.compliance_status ?? 'Not Assessed',
    review_status: item?.review_status ?? 'Not Reviewed',
    ...item
  };
}

export function RegulatoryItemForm({ item }: { item?: RegulatoryItem | undefined }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown>>(initialForm(item));
  const [error, setError] = useState<string | null>(null);
  const lookupsQuery = useRegulatoryLookups();
  const mutations = useRegulatoryItemMutations(item?.id);
  const saving = mutations.create.isPending || mutations.update.isPending;
  const missing = useMemo(() => requiredFields.filter((field) => !String(form[field] ?? '').trim()), [form]);

  async function save() {
    setError(null);
    if (missing.length) {
      setError(`Missing required fields: ${missing.join(', ')}`);
      return;
    }
    try {
      const saved = item?.id ? await mutations.update.mutateAsync(form) : await mutations.create.mutateAsync(form);
      router.push(`/regulatory/${saved.item?.id ?? item?.id}`);
    } catch (err) {
      setError(formatRegulatoryError(err));
    }
  }

  if (lookupsQuery.isLoading) return <RegulatoryLayout current={item?.id ? 'Edit' : 'New'}><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (lookupsQuery.isError) return <RegulatoryLayout current={item?.id ? 'Edit' : 'New'}><RegulatoryErrorState message={lookupsQuery.error} onRetry={() => lookupsQuery.refetch()} /></RegulatoryLayout>;

  return (
    <RegulatoryLayout current={item?.id ? 'Edit Requirement' : 'New Requirement'}>
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <RegulatoryHeader title={item?.id ? 'Edit Regulatory Requirement' : 'Create Regulatory Requirement'} subtitle="Phase 1 foundation form with backend validation, company/site isolation, permissions, audit log, and regulatory history events." />
        {error ? <RegulatoryCard title="Save blocked" subtitle={error}><p className="text-sm text-[var(--psm-muted)]">Fix the listed fields or backend validation error, then save again.</p></RegulatoryCard> : null}
        <RegulatoryIdentitySection form={form} setForm={setForm} lookups={lookupsQuery.data} />
        <RegulatoryJurisdictionSection form={form} setForm={setForm} lookups={lookupsQuery.data} />
        <RegulatoryScopeApplicabilitySection form={form} setForm={setForm} lookups={lookupsQuery.data} />
        <RegulatoryCategoryCriticalitySection form={form} setForm={setForm} lookups={lookupsQuery.data} />
        <RegulatoryOwnershipReviewSection form={form} setForm={setForm} lookups={lookupsQuery.data} />
        <RegulatoryComplianceStatusSection form={form} setForm={setForm} lookups={lookupsQuery.data} />
        <RegulatoryLinksFoundationSection form={form} setForm={setForm} />
        <RegulatoryCard title="8. Review & Save" subtitle="Create or update the foundation register item. Full obligation engine, legal update feed, and reports remain controlled later-phase placeholders.">
          <div className="flex flex-wrap gap-2">
            <RegulatoryButton type="submit" disabled={saving || missing.length > 0} title={missing.length ? `Missing required fields: ${missing.join(', ')}` : saving ? 'Saving regulatory requirement.' : 'Save requirement'}>{saving ? 'Saving...' : 'Save Requirement'}</RegulatoryButton>
            <RegulatoryButton variant="secondary" href="/regulatory/register">Cancel</RegulatoryButton>
          </div>
        </RegulatoryCard>
      </form>
    </RegulatoryLayout>
  );
}
