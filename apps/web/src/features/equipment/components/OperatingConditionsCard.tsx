import type { Equipment } from '@/services/equipment.service';
import { EquipmentField } from './EquipmentField';

export function OperatingConditionsCard({ equipment }: { equipment: Equipment }) {
  return <div className="psm-card p-4"><h2 className="mb-4 text-sm font-semibold">Operating Conditions</h2><EquipmentField label="Pressure" value={equipment.operatingPressure} /><EquipmentField label="Temperature" value={equipment.operatingTemperature} /><EquipmentField label="Phase" value={equipment.phase} /></div>;
}
