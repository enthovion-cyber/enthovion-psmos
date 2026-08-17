'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryAuditMappingMutations } from '../../hooks/useRegulatoryAuditMappingMutations';

export function AuditMappingRejectDialog({ mappingId }: { mappingId: string }) {
  const [reason, setReason] = useState('');
  const mutations = useRegulatoryAuditMappingMutations(mappingId);
  return <RegulatoryCard title="Reject Audit Mapping" subtitle="Reject requires a reason and writes immutable history."><RegulatoryField label="Rejection reason"><textarea className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} /></RegulatoryField><div className="mt-3"><RegulatoryButton variant="danger" disabled={!reason || mutations.reject.isPending} title={!reason ? 'Rejection reason is required.' : 'Reject mapping'} onClick={() => mutations.reject.mutate({ reason })}>Reject</RegulatoryButton></div></RegulatoryCard>;
}
