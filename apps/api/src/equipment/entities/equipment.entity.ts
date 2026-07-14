import { EquipmentCriticality, EquipmentRecord as Equipment, EquipmentStatus } from '../../common/types/db.types';

export type EquipmentEntity = Equipment & {
  status: EquipmentStatus;
  criticality: EquipmentCriticality;
};
