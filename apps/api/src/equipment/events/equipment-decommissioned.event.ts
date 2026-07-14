import { BaseEvent } from '../../events/base.event';

export type EquipmentDecommissionedEvent = BaseEvent<{
  equipmentId: string;
  tag: string;
}>;
