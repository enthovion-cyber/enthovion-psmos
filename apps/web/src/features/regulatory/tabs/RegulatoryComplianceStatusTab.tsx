'use client';

import { useState } from 'react';
import type { RegulatoryDetail } from '../types/regulatory.types';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass, formatRegulatoryError } from '../shared/RegulatoryUi';
import { RegulatoryComplianceStatusBadge } from '../shared/RegulatoryComplianceStatusBadge';
import { useRegulatoryLookups } from '../hooks/useRegulatoryLookups';
import { useRegulatoryItemMutations } from '../hooks/useRegulatoryItemMutations';

export function RegulatoryComplianceStatusTab({ detail }: { detail?: RegulatoryDetail | undefined }) {
  const item = detail?.item;
  const [status, setStatus] = useState(item?.compliance_status ?? '');
  const [rationale, setRationale] = useState(item?.status_rationale ?? '');
  const lookups = useRegulatoryLookups();
  const mutations = useRegulatoryItemMutations(item?.id);
  const disabled = detail?.readOnly || !item?.id;
  async function save() {
    try {
      await mutations.changeComplianceStatus.mutateAsync({ compliance_status: status, rationale });
    } catch (error) {
      window.alert(formatRegulatoryError(error));
    }
  }
  return (
    <RegulatoryCard title="Compliance Status Foundation" subtitle="Foundation status only; detailed obligation/evidence scoring comes in later phases.">
      <div className="mb-4"><RegulatoryComplianceStatusBadge status={item?.compliance_status} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <RegulatoryField label="Compliance status"><select className={regulatoryInputClass()} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Select</option>{lookups.data?.complianceStatuses.map((option) => <option key={option}>{option}</option>)}</select></RegulatoryField>
        <RegulatoryField label="Change rationale"><textarea rows={4} className={regulatoryInputClass()} value={rationale} onChange={(event) => setRationale(event.target.value)} /></RegulatoryField>
      </div>
      <div className="mt-4"><RegulatoryButton disabled={disabled || mutations.changeComplianceStatus.isPending || !rationale.trim()} title={disabled ? detail?.readOnlyReason ?? 'No item loaded.' : !rationale.trim() ? 'Rationale is required.' : 'Save compliance status.'} onClick={() => void save()}>Save Compliance Status</RegulatoryButton></div>
    </RegulatoryCard>
  );
}
