'use client';

import { useState } from 'react';
import { regulatoryAuditMappingGapSchema } from '../../schemas/regulatory-audit-mapping-gap.schema';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryAuditMappingMutations } from '../../hooks/useRegulatoryAuditMappingMutations';

export function AuditMappingGapDialog() {
  const [form, setForm] = useState<Record<string, any>>({ gapType: 'Other', gapSeverity: 'Medium' });
  const mutations = useRegulatoryAuditMappingMutations();
  const validation = regulatoryAuditMappingGapSchema.safeParse(form);
  const reason = validation.success ? '' : validation.error.issues.map((issue) => issue.message).join(' ');
  return <RegulatoryCard title="Create Audit Mapping Gap" subtitle="Create a backend gap record when a missing audit assurance link is found."><div className="grid gap-3 md:grid-cols-2"><RegulatoryField label="Gap title"><input className={regulatoryInputClass()} value={form.gapTitle ?? ''} onChange={(event) => setForm((current) => ({ ...current, gapTitle: event.target.value }))} /></RegulatoryField><RegulatoryField label="Gap type"><input className={regulatoryInputClass()} value={form.gapType ?? ''} onChange={(event) => setForm((current) => ({ ...current, gapType: event.target.value }))} /></RegulatoryField><RegulatoryField label="Severity"><input className={regulatoryInputClass()} value={form.gapSeverity ?? ''} onChange={(event) => setForm((current) => ({ ...current, gapSeverity: event.target.value }))} /></RegulatoryField><RegulatoryField label="Owner user ID"><input className={regulatoryInputClass()} value={form.ownerUserId ?? ''} onChange={(event) => setForm((current) => ({ ...current, ownerUserId: event.target.value }))} /></RegulatoryField></div><div className="mt-3"><RegulatoryButton disabled={!validation.success || mutations.createGap.isPending} title={reason || 'Create gap'} onClick={() => mutations.createGap.mutate(form)}>Create Gap</RegulatoryButton></div></RegulatoryCard>;
}
