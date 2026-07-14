import type { Equipment } from '@/services/equipment.service';
import { EquipmentField } from './EquipmentField';

export function ClassificationCard({ equipment }: { equipment: Equipment }) {
  return <div className="psm-card p-4"><h2 className="mb-4 text-sm font-semibold">Classification</h2><EquipmentField label="Eq. Classification" value={equipment.classification} /><EquipmentField label="Hazard Class" value={equipment.hazardClass} /><EquipmentField label="Area Classification" value={equipment.areaClassification} /></div>;
}
