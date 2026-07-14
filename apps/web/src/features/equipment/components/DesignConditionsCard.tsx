import type { Equipment } from '@/services/equipment.service';
import { EquipmentField } from './EquipmentField';

export function DesignConditionsCard({ equipment }: { equipment: Equipment }) {
  return <div className="psm-card p-4"><h2 className="mb-4 text-sm font-semibold">Design Conditions</h2><EquipmentField label="Pressure (MAWP)" value={equipment.designPressure} /><EquipmentField label="Temperature" value={equipment.designTemperature} /></div>;
}
