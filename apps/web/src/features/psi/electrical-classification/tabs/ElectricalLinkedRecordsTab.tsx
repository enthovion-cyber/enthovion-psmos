import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';

export function ElectricalLinkedRecordsTab({ detail }: { detail: ElectricalDetail }) {
  return <PsiCard title="Linked Records" subtitle="MOC, PSSR, PTW, MI equipment, chemicals/SDS, drawings, audits, incidents, HAZOP/LOPA/SIL and follow-up relationships are resolved by the backend integrations."><p className="text-sm text-[var(--psm-muted)]">Current linked source: unit {detail.classification.unit_id}, area {detail.classification.area_id || 'not linked'}, equipment items {detail.installedEquipment.length}, controlled documents {detail.documents.length}.</p></PsiCard>;
}
