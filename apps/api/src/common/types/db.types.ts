export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const EquipmentStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
  DECOMMISSIONED: 'DECOMMISSIONED'
} as const;

export type EquipmentStatus = (typeof EquipmentStatus)[keyof typeof EquipmentStatus];

export const EquipmentCriticality = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  SAFETY_CRITICAL: 'SAFETY_CRITICAL'
} as const;

export type EquipmentCriticality = (typeof EquipmentCriticality)[keyof typeof EquipmentCriticality];

export const InspectionStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
  DEFERRED: 'DEFERRED'
} as const;

export type InspectionStatus = (typeof InspectionStatus)[keyof typeof InspectionStatus];

export type EquipmentRecord = Record<string, any>;
export type EquipmentNoteRecord = Record<string, any>;

export type UserRecord = {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  status: string;
  [key: string]: any;
};
