export const PermitTypes = [
  'HOT_WORK',
  'COLD_WORK',
  'CONFINED_SPACE',
  'ELECTRICAL_ISOLATION',
  'EXCAVATION',
  'RADIOGRAPHY',
  'WORKING_AT_HEIGHT',
  'LINE_BREAKING',
  'SIMOPS'
] as const;

export type PermitType = (typeof PermitTypes)[number];

export const permitTypeLabels: Record<PermitType, string> = {
  HOT_WORK: 'Hot Work',
  COLD_WORK: 'Cold Work',
  CONFINED_SPACE: 'Confined Space',
  ELECTRICAL_ISOLATION: 'Electrical Isolation / LOTO',
  EXCAVATION: 'Excavation',
  RADIOGRAPHY: 'Radiography',
  WORKING_AT_HEIGHT: 'Working at Height',
  LINE_BREAKING: 'Line Breaking / Equipment Opening',
  SIMOPS: 'Simultaneous Operations / SIMOPS'
};
