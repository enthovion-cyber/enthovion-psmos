'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { regulatoryAuditMappingSchema } from '../schemas/regulatory-audit-mapping.schema';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState } from '../shared/RegulatoryUi';
import { useRegulatoryAuditMappingLookups } from '../hooks/useRegulatoryAuditMappingLookups';
import { useRegulatoryAuditMappingMutations } from '../hooks/useRegulatoryAuditMappingMutations';
import { AuditMappingAuditTargetSection } from './sections/AuditMappingAuditTargetSection';
import { AuditMappingCoverageSection } from './sections/AuditMappingCoverageSection';
import { AuditMappingReadinessSection } from './sections/AuditMappingReadinessSection';
import { AuditMappingRegulatorySourceSection } from './sections/AuditMappingRegulatorySourceSection';
import { AuditMappingTypeSection } from './sections/AuditMappingTypeSection';

export function RegulatoryAuditMappingWizard({ initialValues }: { initialValues?: Record<string, any> | undefined }) {
  const router = useRouter();
  const lookups = useRegulatoryAuditMappingLookups();
  const mutations = useRegulatoryAuditMappingMutations();
  const [form, setFormState] = useState<Record<string, any>>({ regulatorySourceType: 'Regulatory Obligation', auditTargetType: 'Audit Checklist', mappingType: 'Manual Foundation Mapping', mappingStatus: 'Draft', ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const setForm = (patch: Record<string, any>) => setFormState((current) => ({ ...current, ...patch }));
  const validation = useMemo(() => regulatoryAuditMappingSchema.safeParse(form), [form]);
  const disabledReason = validation.success ? '' : validation.error.issues.map((issue) => issue.message).join(' ');
  const submit = async () => {
    setError(null);
    if (!validation.success) { setError(disabledReason); return; }
    try {
      const result = await mutations.create.mutateAsync(form);
      const id = result.mapping?.id ?? result.id;
      router.push(id ? `/regulatory/audit-mapping/${id}` : '/regulatory/audit-mapping/register');
    } catch (err) {
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    }
  };
  return (
    <div className="space-y-5">
      {lookups.isError ? <RegulatoryErrorState message={lookups.error} onRetry={() => lookups.refetch()} /> : null}
      {error ? <RegulatoryCard title="Cannot save audit mapping" subtitle={error}><p className="text-sm text-[var(--psm-muted)]">The backend will also enforce company/site isolation, permissions, mapping rules, and audit/history logging.</p></RegulatoryCard> : null}
      <AuditMappingRegulatorySourceSection form={form} setForm={setForm} sourceTypes={lookups.data?.auditMappingSourceTypes} />
      <AuditMappingAuditTargetSection form={form} setForm={setForm} targetTypes={lookups.data?.auditTargetTypes} />
      <AuditMappingTypeSection form={form} setForm={setForm} mappingTypes={lookups.data?.auditMappingTypes} />
      <AuditMappingCoverageSection mapping={form} />
      <AuditMappingReadinessSection mapping={form} />
      <div className="flex flex-wrap justify-end gap-3">
        <RegulatoryButton href="/regulatory/audit-mapping/register" variant="secondary">Cancel</RegulatoryButton>
        <RegulatoryButton variant="primary" onClick={submit} disabled={mutations.create.isPending} title={mutations.create.isPending ? 'Saving audit mapping...' : disabledReason || 'Create audit mapping'}>{mutations.create.isPending ? 'Saving...' : 'Create Audit Mapping'}</RegulatoryButton>
      </div>
    </div>
  );
}
