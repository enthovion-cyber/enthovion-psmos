import type { MiEquipment } from '../../types/equipment.types';
import { DataPanel } from './panel-utils';

export function EquipmentLocationHierarchyCard({ equipment }: { equipment: MiEquipment }) {
  return <DataPanel title="Location / Hierarchy" data={{ site: equipment.site, unit: equipment.unit, area: equipment.area, parent: equipment.parent?.tag, children: equipment.children?.length ?? 0 }} />;
}
