'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryComplianceMutations } from '../../hooks/useRegulatoryComplianceMutations';

export function ComplianceActionFoundationDialog({ gapId, disabledReason }: { gapId: string; disabledReason?: string | null }) {
  const [reason, setReason] = useState('Action foundation linked to compliance gap');
  const mutations = useRegulatoryComplianceMutations();
  return (
    <RegulatoryCard title="Action / CAPA Foundation" subtitle="Creates or links the compliance action foundation through backend-controlled gap mutation hooks." action={<RegulatoryButton disabled={Boolean(disabledReason) || mutations.createActionFoundation.isPending} title={disabledReason ?? 'Create action foundation.'} onClick={() => mutations.createActionFoundation.mutate({ gapId, data: { reason } })}>{mutations.createActionFoundation.isPending ? 'Creating...' : 'Create Action Foundation'}</RegulatoryButton>}>
      <RegulatoryField label="Reason"><textarea className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} /></RegulatoryField>
      {disabledReason ? <p className="mt-3 text-sm text-danger">{disabledReason}</p> : null}
    </RegulatoryCard>
  );
}
