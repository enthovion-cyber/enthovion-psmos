import type { Equipment } from '@/services/equipment.service';
import { EquipmentField } from './EquipmentField';

export function SafetyInformationCard({ equipment }: { equipment: Equipment }) {
  return <div className="psm-card p-4"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Safety Information</h2><EquipmentField label="Safety Critical" value={equipment.safetyCritical ? 'Yes' : 'No'} /><EquipmentField label="Criticality" value={equipment.criticality} /><EquipmentField label="Hazard Class" value={equipment.hazardClass} /></div>;
}
