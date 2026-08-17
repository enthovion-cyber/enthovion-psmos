'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryComplianceMutations } from '../../hooks/useRegulatoryComplianceMutations';

export function ComplianceGapResolveDialog({ gapId, disabledReason }: { gapId: string; disabledReason?: string | null }) {
  const [reason, setReason] = useState('');
  const mutations = useRegulatoryComplianceMutations();
  const missing = disabledReason ?? (!reason.trim() ? 'Resolution requires a reason or fix note.' : null);
  return (
    <RegulatoryCard title="Resolve Compliance Gap" subtitle="Resolution preserves immutable audit/history and stores resolver metadata." action={<RegulatoryButton disabled={Boolean(missing) || mutations.resolveGap.isPending} title={missing ?? 'Resolve compliance gap.'} onClick={() => mutations.resolveGap.mutate({ gapId, reason })}>{mutations.resolveGap.isPending ? 'Resolving...' : 'Resolve'}</RegulatoryButton>}>
      <RegulatoryField label="Resolution reason / fix note"><textarea className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} /></RegulatoryField>
      {missing ? <p className="mt-3 text-sm text-danger">{missing}</p> : null}
    </RegulatoryCard>
  );
}
