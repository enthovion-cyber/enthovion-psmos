import { EquipmentRecord as Equipment } from '../../common/types/db.types';

export function toEquipmentSearchText(equipment: Equipment): string {
  return [
    equipment.tag,
    equipment.name,
    equipment.description,
    equipment.type,
    equipment.subtype,
    equipment.manufacturer,
    equipment.model,
    equipment.serialNumber,
    equipment.fluidName,
    equipment.hazardClass
  ]
    .filter(Boolean)
    .join(' ');
}
