'use client';

import { useEquipmentLinkedRecords } from '../../hooks/useLinkedRecords';
import { SectionCard } from '../../safeguards/SafeguardUiPrimitives';

export function EquipmentLinkedRecordsSummaryCard({ equipmentId }: { equipmentId: string }) {
  const query = useEquipmentLinkedRecords(equipmentId);
  const summary = query.data?.summary;
  return <SectionCard title="Linked Records Summary" description="Cross-module records connected to this equipment."><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-[var(--psm-muted)]">Total linked records</p><p className="text-2xl font-bold">{summary?.totalLinks ?? 0}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Open critical / readiness</p><p className="text-2xl font-bold">{query.data?.rows?.filter((row) => row.readiness_impact).length ?? 0}</p></div><div><p className="text-xs text-[var(--psm-muted)]">MOC/PSSR/PTW/LOTO</p><p className="text-2xl font-bold">{query.data?.rows?.filter((row) => /MOC|PSSR|PTW|LOTO/i.test(`${row.source_module} ${row.target_module}`)).length ?? 0}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Permission limited</p><p className="text-2xl font-bold">{summary?.permissionLimitedLinks ?? 0}</p></div></div></SectionCard>;
}
