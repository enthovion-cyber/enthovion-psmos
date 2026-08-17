'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryComplianceMutations } from '../../hooks/useRegulatoryComplianceMutations';

export function ComplianceReassessDialog({ assessmentId, disabledReason }: { assessmentId: string; disabledReason?: string | null }) {
  const [reason, setReason] = useState('');
  const mutations = useRegulatoryComplianceMutations();
  const missing = disabledReason ?? (!reason.trim() ? 'Stale/reassessment action requires a reason.' : null);
  return (
    <RegulatoryCard title="Mark Stale / Reassess" subtitle="Marks compliance status stale and creates backend history for source, obligation, evidence, or policy changes." action={<RegulatoryButton disabled={Boolean(missing) || mutations.markStale.isPending} title={missing ?? 'Mark stale and require reassessment.'} onClick={() => mutations.markStale.mutate({ assessmentId, data: { reason, staleStatus: 'Needs Reassessment' } })}>{mutations.markStale.isPending ? 'Saving...' : 'Mark Needs Reassessment'}</RegulatoryButton>}>
      <RegulatoryField label="Reason"><textarea className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} /></RegulatoryField>
      {missing ? <p className="mt-3 text-sm text-danger">{missing}</p> : null}
    </RegulatoryCard>
  );
}
