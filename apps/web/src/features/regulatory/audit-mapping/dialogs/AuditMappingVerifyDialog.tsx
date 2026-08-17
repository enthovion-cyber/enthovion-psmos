'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryAuditMappingMutations } from '../../hooks/useRegulatoryAuditMappingMutations';

export function AuditMappingVerifyDialog({ mappingId }: { mappingId: string }) {
  const [reason, setReason] = useState('');
  const mutations = useRegulatoryAuditMappingMutations(mappingId);
  return <RegulatoryCard title="Verify Audit Mapping" subtitle="Verification is backend-controlled and creates audit/history records."><RegulatoryField label="Verification comment"><textarea className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} /></RegulatoryField><div className="mt-3"><RegulatoryButton disabled={mutations.verify.isPending} title={!reason ? 'Verification comment is recommended.' : 'Verify mapping'} onClick={() => mutations.verify.mutate({ reason, reviewComment: reason })}>Verify</RegulatoryButton></div></RegulatoryCard>;
}
