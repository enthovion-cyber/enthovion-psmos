import type { Equipment } from '@/services/equipment.service';
import { EquipmentField } from './EquipmentField';

export function ProcessFluidCard({ equipment }: { equipment: Equipment }) {
  return <div className="psm-card p-4"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Fluid & Hazard Info</h2><EquipmentField label="Fluid Name" value={equipment.fluidName} /><EquipmentField label="Fluid Service" value={equipment.fluidService} /><EquipmentField label="SDS Reference" value={equipment.sdsReference} /><EquipmentField label="Exposure Limits" value={equipment.exposureLimits} /><EquipmentField label="Environmental Impact" value={equipment.environmentalImpact} /></div>;
}
