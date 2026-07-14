import { z } from 'zod';

export const permitTypeOptions = [
  { value: 'HOT_WORK', label: 'Hot Work' },
  { value: 'COLD_WORK', label: 'Cold Work' },
  { value: 'CONFINED_SPACE', label: 'Confined Space Entry' },
  { value: 'ELECTRICAL_ISOLATION', label: 'Electrical Isolation / LOTO' },
  { value: 'EXCAVATION', label: 'Excavation' },
  { value: 'RADIOGRAPHY', label: 'Radiography' },
  { value: 'WORKING_AT_HEIGHT', label: 'Working at Height' },
  { value: 'LINE_BREAKING', label: 'Line Breaking / Equipment Opening' },
  { value: 'SIMOPS', label: 'SIMOPS' }
] as const;

export const permitTypes = permitTypeOptions.map((item) => item.value);

const optionalText = z.string().optional();
const bool = z.boolean().optional();

export const isolationPointSchema = z.object({
  energyType: z.string().min(1, 'Energy Type is required'),
  isolationPointTag: z.string().min(1, 'Isolation Point Tag is required'),
  valveOrBreakerTag: optionalText,
  requiredPosition: z.string().min(1, 'Required Position is required'),
  lockNumber: optionalText,
  holderName: optionalText,
  verificationRequired: bool,
  notes: optionalText
});

export const workerSchema = z.object({
  workerName: z.string().min(1, 'Worker Name is required'),
  company: z.string().min(1, 'Company is required'),
  trade: optionalText,
  badgeId: optionalText,
  contactNumber: optionalText,
  briefingRequired: bool,
  briefingCompleted: bool,
  signInRequired: bool,
  emergencyContact: optionalText
});

export const attachmentSchema = z.object({
  id: z.string(),
  attachmentType: z.string().min(1),
  fileName: z.string().min(1),
  documentControlId: optionalText,
  file: z.any().optional()
});

export const permitCreateSchema = z.object({
  permitType: z.string().min(1, 'Permit Type required'),
  title: z.string().min(1, 'Title required'),
  description: optionalText,
  workOrderNumber: optionalText,
  jobNumber: optionalText,
  priority: z.string().min(1),
  riskLevel: z.string().min(1, 'Risk level required'),
  plannedStartAt: z.string().min(1, 'Start date required'),
  plannedEndAt: z.string().min(1, 'End date required'),
  permitDuration: optionalText,
  shift: z.string().min(1),
  companyId: optionalText,
  company: optionalText,
  siteId: z.string().min(1, 'Site required'),
  sitePlant: optionalText,

  department: optionalText,
  unitId: optionalText,
  processUnit: optionalText,
  areaId: z.string().min(1, 'Area required'),
  area: optionalText,
  locationDescription: z.string().min(1, 'Work Location Description required'),
  gpsLatitude: optionalText,
  gpsLongitude: optionalText,
  equipmentId: optionalText,
  equipmentTag: optionalText,
  equipmentName: optionalText,
  equipmentType: optionalText,
  equipmentCriticality: optionalText,
  linkedEquipmentTags: optionalText,
  nearbyEquipment: optionalText,
  locationMapReference: optionalText,

  detailedWorkDescription: z.string().min(1, 'Detailed Work Description required'),
  workMethod: z.string().min(1, 'Work Method required'),
  toolsEquipmentRequired: optionalText,
  chemicalsMaterialsUsed: optionalText,
  energyElectrical: bool,
  energyMechanical: bool,
  energyPneumatic: bool,
  energyHydraulic: bool,
  energyThermal: bool,
  energyChemical: bool,
  energyGravitational: bool,
  jsaRequired: bool,
  sopReference: optionalText,
  pidReference: optionalText,
  drawingsReference: optionalText,
  specialInstructions: optionalText,

  ignitionSourceType: optionalText,
  fireWatchRequired: bool,
  fireWatchName: optionalText,
  fireExtinguisherAvailable: bool,
  combustiblesRemoved: bool,
  areaBarricaded: bool,
  hotWorkGasTestRequired: bool,
  lelRequirement: optionalText,
  confinedSpaceId: optionalText,
  entrySupervisor: optionalText,
  attendant: optionalText,
  entrants: optionalText,
  rescuePlanRequired: bool,
  rescuePlanDocument: optionalText,
  ventilationRequired: bool,
  atmosphericTestingRequired: bool,
  communicationMethod: optionalText,
  retrievalEquipmentAvailable: bool,
  typeIsolationRequired: bool,
  isolationAuthorityType: optionalText,
  lockBoxRequired: bool,
  multipleLocksRequired: bool,
  electricalDrawingReference: optionalText,
  energyIsolationPlanRequired: bool,
  excavationDepth: optionalText,
  buriedServicesChecked: bool,
  excavationDrawing: optionalText,
  soilCondition: optionalText,
  shoringRequired: bool,
  barricadeRequired: bool,
  gasLineCableClearance: optionalText,
  radiationSource: optionalText,
  exclusionZoneRadius: optionalText,
  radiationSurveyRequired: bool,
  radiationMonitor: optionalText,
  warningSignsPosted: bool,
  areaEvacuationRequired: bool,
  workHeight: optionalText,
  fallProtectionRequired: bool,
  harnessInspectionCompleted: bool,
  anchorPointVerified: bool,
  scaffoldTagNumber: optionalText,
  ladderInspectionCompleted: bool,
  lineEquipmentNumber: optionalText,
  depressurisedConfirmed: bool,
  drainedConfirmed: bool,
  flushedConfirmed: bool,
  purgedConfirmed: bool,
  blindInstalled: bool,
  residualChemicalHazard: optionalText,
  ppeRequirement: optionalText,
  concurrentWorkDescription: optionalText,
  nearbyActivePermits: optionalText,
  simopsCoordinator: optionalText,
  conflictReviewRequired: bool,
  controlMeasures: optionalText,

  isolationRequired: bool,
  isolationPlanDescription: optionalText,
  isolationAuthority: optionalText,
  isolationEnergySources: optionalText,
  isolationPoints: z.array(isolationPointSchema),

  gasTestRequired: bool,
  initialGasTestRequiredBeforeActivation: bool,
  retestInterval: optionalText,
  gasTester: optionalText,
  instrumentId: optionalText,
  instrumentCalibrationDate: optionalText,
  gasO2: bool,
  gasLEL: bool,
  gasH2S: bool,
  gasCO: bool,
  gasSO2: bool,
  gasCl2: bool,
  gasNH3: bool,
  gasHF: bool,
  customGas: optionalText,
  thresholdO2: optionalText,
  thresholdLEL: optionalText,
  thresholdH2S: optionalText,
  thresholdCO: optionalText,
  thresholdCustomGas: optionalText,

  permitHolder: z.string().min(1, 'Permit Holder required'),
  performingAuthority: z.string().min(1, 'Performing Authority required'),
  permitIssuer: optionalText,
  areaAuthority: z.string().min(1, 'Area Authority required'),
  contractorCompanyId: optionalText,
  contractorCompany: optionalText,
  supervisor: optionalText,
  maxPersonnel: z.coerce.number().min(1).max(200).optional(),
  workers: z.array(workerSchema),

  attachments: z.array(attachmentSchema)
}).superRefine((value, ctx) => {
  if (new Date(value.plannedEndAt).getTime() <= new Date(value.plannedStartAt).getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['plannedEndAt'], message: 'End date must be after start date' });
  }
  if (['HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL_ISOLATION', 'LINE_BREAKING'].includes(value.permitType) && !value.equipmentTag && !value.equipmentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['equipmentTag'], message: 'Equipment Tag required for equipment-based permits' });
  }
  const hasEnergy = value.energyElectrical || value.energyMechanical || value.energyPneumatic || value.energyHydraulic || value.energyThermal || value.energyChemical || value.energyGravitational;
  if (value.permitType === 'ELECTRICAL_ISOLATION' && !hasEnergy) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['energyElectrical'], message: 'Energy Sources required when LOTO permit type selected' });
  }
  if ((value.isolationRequired || value.permitType === 'ELECTRICAL_ISOLATION') && value.isolationPoints.length < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['isolationPoints'], message: 'At least one isolation point is required' });
  }
  if (['HOT_WORK', 'CONFINED_SPACE'].includes(value.permitType) && !value.gasTestRequired) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gasTestRequired'], message: `${value.permitType === 'HOT_WORK' ? 'Hot Work' : 'Confined Space'} requires gas test` });
  }
  if (value.gasTestRequired && !value.gasTester) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gasTester'], message: 'Gas tester required if gas test required' });
  }
  if (value.gasTestRequired && !value.instrumentCalibrationDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['instrumentCalibrationDate'], message: 'Calibration date required' });
  }
  if (value.workers.length < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['workers'], message: 'At least one worker required' });
  }
  if (value.workers.some((worker) => worker.company && worker.company !== value.company) && !value.contractorCompany) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contractorCompany'], message: 'Contractor company required if external workers are included' });
  }
  const attachmentTypes = new Set(value.attachments.map((item) => item.attachmentType));
  if (value.permitType === 'CONFINED_SPACE' && !attachmentTypes.has('Rescue Plan')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['attachments'], message: 'Confined Space requires Rescue Plan attachment' });
  }
  if (value.permitType === 'RADIOGRAPHY' && !attachmentTypes.has('Radiography Plan')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['attachments'], message: 'Radiography requires Radiography Plan' });
  }
  if (['High', 'Critical', 'Safety-Critical'].includes(value.riskLevel) && !attachmentTypes.has('Job Safety Analysis') && !attachmentTypes.has('Method Statement')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['attachments'], message: 'High/Critical risk requires JSA or Method Statement' });
  }
});

export type PermitCreateValues = z.infer<typeof permitCreateSchema>;

export function defaultPermitCreateValues(): PermitCreateValues {
  const start = toLocalInputValue(new Date());
  const end = toLocalInputValue(new Date(Date.now() + 12 * 60 * 60 * 1000));
  return {
    permitType: 'HOT_WORK',
    title: '',
    description: '',
    workOrderNumber: '',
    jobNumber: '',
    priority: 'Medium',
    riskLevel: 'High',
    plannedStartAt: start,
    plannedEndAt: end,
    permitDuration: '12 hours',
    shift: 'Day',
    companyId: '',
    company: 'Alkylation Plant',
    siteId: 'site_jubail',
    sitePlant: 'Jubail Industrial City',
    department: '',
    unitId: 'unit_alky',
    processUnit: 'Alkylation Unit',
    areaId: 'area_reactor',
    area: 'Reactor Area',
    locationDescription: '',
    gpsLatitude: '',
    gpsLongitude: '',
    equipmentId: '',
    equipmentTag: '',
    equipmentName: '',
    equipmentType: '',
    equipmentCriticality: '',
    linkedEquipmentTags: '',
    nearbyEquipment: '',
    locationMapReference: '',
    detailedWorkDescription: '',
    workMethod: '',
    toolsEquipmentRequired: '',
    chemicalsMaterialsUsed: '',
    energyElectrical: false,
    energyMechanical: false,
    energyPneumatic: false,
    energyHydraulic: false,
    energyThermal: false,
    energyChemical: false,
    energyGravitational: false,
    jsaRequired: true,
    sopReference: '',
    pidReference: '',
    drawingsReference: '',
    specialInstructions: '',
    ignitionSourceType: 'Welding',
    fireWatchRequired: true,
    fireWatchName: '',
    fireExtinguisherAvailable: false,
    combustiblesRemoved: false,
    areaBarricaded: false,
    hotWorkGasTestRequired: true,
    lelRequirement: 'Default 0% LEL preferred',
    confinedSpaceId: '',
    entrySupervisor: '',
    attendant: '',
    entrants: '',
    rescuePlanRequired: false,
    rescuePlanDocument: '',
    ventilationRequired: false,
    atmosphericTestingRequired: false,
    communicationMethod: '',
    retrievalEquipmentAvailable: false,
    typeIsolationRequired: false,
    isolationAuthorityType: '',
    lockBoxRequired: false,
    multipleLocksRequired: false,
    electricalDrawingReference: '',
    energyIsolationPlanRequired: false,
    excavationDepth: '',
    buriedServicesChecked: false,
    excavationDrawing: '',
    soilCondition: '',
    shoringRequired: false,
    barricadeRequired: false,
    gasLineCableClearance: '',
    radiationSource: '',
    exclusionZoneRadius: '',
    radiationSurveyRequired: false,
    radiationMonitor: '',
    warningSignsPosted: false,
    areaEvacuationRequired: false,
    workHeight: '',
    fallProtectionRequired: false,
    harnessInspectionCompleted: false,
    anchorPointVerified: false,
    scaffoldTagNumber: '',
    ladderInspectionCompleted: false,
    lineEquipmentNumber: '',
    depressurisedConfirmed: false,
    drainedConfirmed: false,
    flushedConfirmed: false,
    purgedConfirmed: false,
    blindInstalled: false,
    residualChemicalHazard: '',
    ppeRequirement: '',
    concurrentWorkDescription: '',
    nearbyActivePermits: '',
    simopsCoordinator: '',
    conflictReviewRequired: false,
    controlMeasures: '',
    isolationRequired: true,
    isolationPlanDescription: '',
    isolationAuthority: '',
    isolationEnergySources: '',
    isolationPoints: [],
    gasTestRequired: true,
    initialGasTestRequiredBeforeActivation: true,
    retestInterval: '2 hours',
    gasTester: '',
    instrumentId: '',
    instrumentCalibrationDate: '',
    gasO2: true,
    gasLEL: true,
    gasH2S: true,
    gasCO: true,
    gasSO2: false,
    gasCl2: false,
    gasNH3: false,
    gasHF: false,
    customGas: '',
    thresholdO2: '19.5-23.5%',
    thresholdLEL: 'Hot Work 0% preferred; Confined Space <10%',
    thresholdH2S: '',
    thresholdCO: '',
    thresholdCustomGas: '',
    permitHolder: '',
    performingAuthority: '',
    permitIssuer: '',
    areaAuthority: '',
    contractorCompanyId: '',
    contractorCompany: '',
    supervisor: '',
    maxPersonnel: 6,
    workers: [],
    attachments: []
  };
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
