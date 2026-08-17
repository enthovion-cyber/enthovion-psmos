'use client';

import { useState } from 'react';
import { RegulatoryButton, RegulatoryCard, RegulatoryField, regulatoryInputClass } from '../../shared/RegulatoryUi';
import { useRegulatoryAuditMappingMutations } from '../../hooks/useRegulatoryAuditMappingMutations';

export function AuditMappingArchiveDialog({ mappingId }: { mappingId: string }) {
  const [reason, setReason] = useState('');
  const mutations = useRegulatoryAuditMappingMutations(mappingId);
  return <RegulatoryCard title="Archive Audit Mapping" subtitle="Archive preserves history and blocks active readiness use."><RegulatoryField label="Archive reason"><textarea className={regulatoryInputClass()} value={reason} onChange={(event) => setReason(event.target.value)} /></RegulatoryField><div className="mt-3"><RegulatoryButton variant="danger" disabled={!reason || mutations.archive.isPending} title={!reason ? 'Archive reason is required.' : 'Archive mapping'} onClick={() => mutations.archive.mutate({ reason })}>Archive</RegulatoryButton></div></RegulatoryCard>;
}
