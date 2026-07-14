export const EquipmentTypes = [
  'Pump',
  'Compressor',
  'Vessel',
  'Tank',
  'Heat Exchanger',
  'Valve',
  'Piping',
  'Instrument',
  'Electrical',
  'Safety System'
] as const;

export type EquipmentType = (typeof EquipmentTypes)[number];
