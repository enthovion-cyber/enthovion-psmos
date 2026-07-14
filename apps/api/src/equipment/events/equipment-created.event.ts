import { BaseEvent } from '../../events/base.event';

export type EquipmentCreatedEvent = BaseEvent<{
  equipmentId: string;
  tag: string;
}>;
