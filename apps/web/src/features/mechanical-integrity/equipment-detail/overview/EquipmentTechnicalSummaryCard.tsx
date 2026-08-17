import type { MiEquipmentTechnicalData } from '../../types/equipment.types';
import { DataPanel } from './panel-utils';

export function EquipmentTechnicalSummaryCard({ technical }: { technical: MiEquipmentTechnicalData }) {
  return <DataPanel title="Technical Data Summary" data={{ ...technical.designData, ...technical.operatingData, ...technical.materialsCorrosion, ...technical.processFluidChemical }} />;
}
