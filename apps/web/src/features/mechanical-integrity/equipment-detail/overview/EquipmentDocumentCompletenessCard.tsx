'use client';

import { useEquipmentMiDocuments } from '../../hooks/useMiDocuments';
import { MissingDocumentBadge } from '../../shared/MissingDocumentBadge';
import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';

export function EquipmentDocumentCompletenessCard({ equipmentId }: { equipmentId: string }) {
  const query = useEquipmentMiDocuments(equipmentId);
  const summary = query.data?.summary;
  return <SectionCard title="Document Completeness" description="Required controlled-document evidence for readiness and equipment overview."><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-[var(--psm-muted)]">Required documents</p><p className="text-2xl font-bold">{summary?.requiredDocuments ?? 0}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Missing</p><MissingDocumentBadge missing={summary?.missingRequiredDocuments ?? 0} /></div><div><p className="text-xs text-[var(--psm-muted)]">Expired certificates</p><p className="text-2xl font-bold">{summary?.expiredDocuments ?? 0}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Readiness blocked</p><p className="text-2xl font-bold">{summary?.readinessBlockedByDocuments ?? 0}</p></div></div></SectionCard>;
}
