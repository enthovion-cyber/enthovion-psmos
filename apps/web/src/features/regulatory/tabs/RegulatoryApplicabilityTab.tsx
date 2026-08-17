'use client';

import { useState } from 'react';
import type { RegulatoryDetail } from '../types/regulatory.types';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass, formatRegulatoryError } from '../shared/RegulatoryUi';
import { RegulatoryApplicabilityBadge } from '../shared/RegulatoryApplicabilityBadge';
import { useRegulatoryLookups } from '../hooks/useRegulatoryLookups';
import { useRegulatoryItemMutations } from '../hooks/useRegulatoryItemMutations';

export function RegulatoryApplicabilityTab({ detail }: { detail?: RegulatoryDetail | undefined }) {
  const item = detail?.item;
  const [status, setStatus] = useState(item?.applicability_status ?? '');
  const [rationale, setRationale] = useState(item?.applicability_rationale ?? '');
  const lookups = useRegulatoryLookups();
  const mutations = useRegulatoryItemMutations(item?.id);
  const disabled = detail?.readOnly || !item?.id;
  async function save() {
    try {
      await mutations.changeApplicability.mutateAsync({ applicability_status: status, rationale });
    } catch (error) {
      window.alert(formatRegulatoryError(error));
    }
  }
  return (
    <RegulatoryCard title="Applicability Foundation" subtitle="Applicability changes require rationale and are written to audit/history by the backend.">
      <div className="mb-4 flex flex-wrap items-center gap-2"><RegulatoryApplicabilityBadge status={item?.applicability_status} />{item?.id ? <RegulatoryButton href={`/regulatory/applicability/assessments/new?regulatoryItemId=${item.id}`} variant="secondary">New Assessment</RegulatoryButton> : null}{item?.id ? <RegulatoryButton href="/regulatory/applicability/matrix" variant="secondary">Open Matrix</RegulatoryButton> : null}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <RegulatoryField label="Applicability status" helper="For complete Phase 2 workflow use a formal applicability assessment."><select className={regulatoryInputClass()} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Select</option>{lookups.data?.applicabilityStatuses.map((option) => <option key={option}>{option}</option>)}</select></RegulatoryField>
        <RegulatoryField label="Change rationale" helper="Backend blocks missing rationale based on company/site policy."><textarea rows={4} className={regulatoryInputClass()} value={rationale} onChange={(event) => setRationale(event.target.value)} /></RegulatoryField>
      </div>
      <div className="mt-4"><RegulatoryButton disabled={disabled || mutations.changeApplicability.isPending || !rationale.trim()} title={disabled ? detail?.readOnlyReason ?? 'No item loaded.' : !rationale.trim() ? 'Rationale is required.' : 'Save applicability.'} onClick={() => void save()}>Save Applicability</RegulatoryButton></div>
    </RegulatoryCard>
  );
}
