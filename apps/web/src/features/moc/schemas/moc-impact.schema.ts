import { z } from 'zod';

export const mocImpactSchema = z.object({
  answers: z.record(z.any()).default({}),
  justifications: z.record(z.string().optional()).default({}),
  metadata: z.record(z.any()).default({})
});

export type MOCImpactValues = z.infer<typeof mocImpactSchema>;

export type ImpactFieldConfig = {
  key: string;
  label: string;
  type?: 'boolean' | 'text' | 'textarea' | 'date' | 'multi';
  required?: boolean;
  justificationWhenNo?: boolean;
  helper?: string;
};

export type ImpactSectionConfig = {
  area: string;
  title: string;
  description: string;
  fields: ImpactFieldConfig[];
};

export const impactSections: ImpactSectionConfig[] = [
  {
    area: 'equipment',
    title: 'Equipment Impact',
    description: 'Equipment records, design basis, P&IDs, inspection, maintenance, relief protection, and BOM impacts.',
    fields: [
      { key: 'equipmentAffected', label: 'Does this change affect equipment?', required: true },
      { key: 'primaryEquipmentAffected', label: 'Primary equipment affected', type: 'text' },
      { key: 'additionalEquipmentAffected', label: 'Additional equipment affected', type: 'textarea' },
      { key: 'equipmentTypeAffected', label: 'Equipment type affected', type: 'text' },
      { key: 'equipmentCriticality', label: 'Equipment criticality', type: 'text' },
      { key: 'equipmentSpecificationChanged', label: 'Equipment specification changed?' },
      { key: 'likeForLikeReplacementConfirmed', label: 'Like-for-like replacement confirmed?' },
      { key: 'designRatingChanged', label: 'Design rating changed?' },
      { key: 'materialOfConstructionChanged', label: 'Material of construction changed?' },
      { key: 'pressureBoundaryAffected', label: 'Pressure boundary affected?' },
      { key: 'rotatingEquipmentAffected', label: 'Rotating equipment affected?' },
      { key: 'electricalEquipmentAffected', label: 'Electrical equipment affected?' },
      { key: 'instrumentationAffected', label: 'Instrumentation affected?' },
      { key: 'reliefDeviceAffected', label: 'Relief device affected?' },
      { key: 'equipmentDatasheetUpdateRequired', label: 'Equipment datasheet update required?' },
      { key: 'equipmentRegistryUpdateRequired', label: 'Equipment Registry update required?' },
      { key: 'pidUpdateRequired', label: 'P&ID update required?', justificationWhenNo: true },
      { key: 'inspectionPlanUpdateRequired', label: 'Inspection plan update required?' },
      { key: 'maintenancePlanUpdateRequired', label: 'Maintenance plan update required?' },
      { key: 'sparePartsBomUpdateRequired', label: 'Spare parts/BOM update required?' }
    ]
  },
  {
    area: 'chemistry',
    title: 'Process Chemistry Impact',
    description: 'Chemical, SDS, PSI, exposure, compatibility, discharge, waste, and material selection impacts.',
    fields: [
      { key: 'chemistryAffected', label: 'Does this change affect process chemistry?', required: true },
      { key: 'chemicalsAffected', label: 'Chemicals affected', type: 'textarea' },
      { key: 'newChemicalIntroduced', label: 'New chemical introduced?' },
      { key: 'chemicalRemoved', label: 'Chemical removed?' },
      { key: 'compositionChanged', label: 'Composition changed?' },
      { key: 'concentrationChanged', label: 'Concentration changed?' },
      { key: 'reactionChemistryChanged', label: 'Reaction chemistry changed?' },
      { key: 'catalystChanged', label: 'Catalyst changed?' },
      { key: 'corrosivityChanged', label: 'Corrosivity changed?' },
      { key: 'toxicityChanged', label: 'Toxicity changed?' },
      { key: 'flammabilityChanged', label: 'Flammability changed?' },
      { key: 'sdsUpdateRequired', label: 'SDS update required?' },
      { key: 'psiChemicalDataUpdateRequired', label: 'PSI chemical data update required?' },
      { key: 'exposureLimitsAffected', label: 'Exposure limits affected?' },
      { key: 'environmentalDischargeAffected', label: 'Environmental discharge affected?' },
      { key: 'wasteStreamAffected', label: 'Waste stream affected?' },
      { key: 'compatibilityReviewRequired', label: 'Compatibility review required?' },
      { key: 'materialSelectionReviewRequired', label: 'Material selection review required?' }
    ]
  },
  {
    area: 'procedure',
    title: 'Procedure / SOP Impact',
    description: 'SOP, operating, emergency, maintenance, startup/shutdown, LOTO, permit, and control room instruction impacts.',
    fields: [
      { key: 'proceduresAffected', label: 'Does this change affect procedures?', required: true },
      { key: 'sopUpdateRequired', label: 'SOP update required?' },
      { key: 'affectedSops', label: 'Affected SOPs', type: 'textarea' },
      { key: 'operatingProcedureUpdateRequired', label: 'Operating procedure update required?' },
      { key: 'emergencyProcedureUpdateRequired', label: 'Emergency procedure update required?' },
      { key: 'maintenanceProcedureUpdateRequired', label: 'Maintenance procedure update required?' },
      { key: 'startupShutdownProcedureUpdateRequired', label: 'Startup/shutdown procedure update required?' },
      { key: 'lotoProcedureUpdateRequired', label: 'LOTO procedure update required?' },
      { key: 'permitProcedureAffected', label: 'Permit procedure affected?' },
      { key: 'controlRoomInstructionsAffected', label: 'Control room operating instructions affected?' },
      { key: 'temporaryOperatingInstructionRequired', label: 'Temporary operating instruction required?' },
      { key: 'procedureOwner', label: 'Procedure owner', type: 'text' },
      { key: 'procedureUpdateDueDate', label: 'Procedure update due date', type: 'date' }
    ]
  },
  {
    area: 'operating_limits',
    title: 'Operating Limits Impact',
    description: 'Pressure, temperature, flow, level, composition, alarms, trips, interlocks, and safe envelope impacts.',
    fields: [
      { key: 'operatingLimitsChanged', label: 'Operating limits changed?', required: true },
      { key: 'pressureLimitsChanged', label: 'Pressure limits changed?' },
      { key: 'temperatureLimitsChanged', label: 'Temperature limits changed?' },
      { key: 'flowLimitsChanged', label: 'Flow limits changed?' },
      { key: 'levelLimitsChanged', label: 'Level limits changed?' },
      { key: 'compositionLimitsChanged', label: 'Composition limits changed?' },
      { key: 'alarmSetpointsChanged', label: 'Alarm setpoints changed?' },
      { key: 'interlockSetpointsChanged', label: 'Interlock setpoints changed?' },
      { key: 'tripSetpointsChanged', label: 'Trip setpoints changed?' },
      { key: 'safeOperatingEnvelopeChanged', label: 'Safe operating envelope changed?' },
      { key: 'operatingEnvelopeDocumentUpdateRequired', label: 'Operating envelope document update required?' },
      { key: 'hazopDeviationReviewRequired', label: 'HAZOP deviation review required?' },
      { key: 'operatorTrainingRequired', label: 'Operator training required?' },
      { key: 'controlRoomCommunicationRequired', label: 'Control room communication required?' }
    ]
  },
  {
    area: 'safety_systems',
    title: 'Safety Systems Impact',
    description: 'SIS, DCS/BPCS, ESD, fire and gas, alarms, relief systems, interlocks, LOPA/SIL, bypasses, and cybersecurity.',
    fields: [
      { key: 'safetySystemsAffected', label: 'Safety systems affected?', required: true },
      { key: 'sisAffected', label: 'SIS affected?' },
      { key: 'dcsAffected', label: 'DCS affected?' },
      { key: 'bpcsAffected', label: 'BPCS affected?' },
      { key: 'esdAffected', label: 'ESD affected?' },
      { key: 'fireGasSystemAffected', label: 'Fire and gas system affected?' },
      { key: 'alarmManagementAffected', label: 'Alarm management affected?' },
      { key: 'psvReliefSystemAffected', label: 'PSV / relief system affected?' },
      { key: 'interlockAffected', label: 'Interlock affected?' },
      { key: 'safetyCriticalElementAffected', label: 'Safety critical element affected?' },
      { key: 'lopaReviewRequired', label: 'LOPA review required?' },
      { key: 'silVerificationRequired', label: 'SIL verification required?' },
      { key: 'sisRevalidationRequired', label: 'SIS revalidation required?' },
      { key: 'causeEffectUpdateRequired', label: 'Cause & effect update required?' },
      { key: 'functionalTestProcedureUpdateRequired', label: 'Functional test procedure update required?' },
      { key: 'bypassOverrideRegisterAffected', label: 'Bypass/override register affected?' },
      { key: 'cybersecurityReviewRequired', label: 'Cybersecurity review required?' }
    ]
  },
  {
    area: 'training',
    title: 'Training Impact',
    description: 'Affected roles, departments, contractors, training materials, startup gating, owner, and target completion.',
    fields: [
      { key: 'trainingRequired', label: 'Training required?', required: true },
      { key: 'affectedRoles', label: 'Affected roles', type: 'textarea' },
      { key: 'affectedDepartments', label: 'Affected departments', type: 'textarea' },
      { key: 'operatorsRequired', label: 'Operators required?' },
      { key: 'maintenanceRequired', label: 'Maintenance required?' },
      { key: 'controlRoomRequired', label: 'Control room required?' },
      { key: 'contractorsRequired', label: 'Contractors required?' },
      { key: 'hseRequired', label: 'HSE required?' },
      { key: 'trainingMaterialUpdateRequired', label: 'Training material update required?' },
      { key: 'trainingBeforeStartupRequired', label: 'Training must be complete before startup?' },
      { key: 'targetTrainingCompletionDate', label: 'Target training completion date', type: 'date' },
      { key: 'trainingOwner', label: 'Training owner', type: 'text' }
    ]
  },
  {
    area: 'documents',
    title: 'Document / PSI Impact',
    description: 'PSI, Document Control, P&ID, drawings, design basis, datasheets, manuals, SOPs, SDS, C&E, and registers.',
    fields: [
      { key: 'psiUpdateRequired', label: 'PSI update required?' },
      { key: 'documentControlUpdateRequired', label: 'Document Control update required?', required: true },
      { key: 'pidRevisionRequired', label: 'P&ID revision required?' },
      { key: 'drawingUpdateRequired', label: 'Drawing update required?' },
      { key: 'designBasisUpdateRequired', label: 'Design basis update required?' },
      { key: 'vendorManualUpdateRequired', label: 'Vendor manual update required?' },
      { key: 'operatingLimitsDocumentUpdateRequired', label: 'Operating limits document update required?' },
      { key: 'sopRevisionRequired', label: 'SOP revision required?' },
      { key: 'sdsUpdateRequired', label: 'SDS update required?' },
      { key: 'chemicalRegisterUpdateRequired', label: 'Chemical register update required?' },
      { key: 'hazardousAreaDrawingUpdateRequired', label: 'Hazardous area drawing update required?' },
      { key: 'causeEffectDocumentUpdateRequired', label: 'Cause & effect update required?' },
      { key: 'alarmInterlockListUpdateRequired', label: 'Alarm/interlock list update required?' },
      { key: 'inspectionPlanDocumentUpdateRequired', label: 'Inspection plan document update required?' },
      { key: 'maintenancePlanDocumentUpdateRequired', label: 'Maintenance plan document update required?' }
    ]
  },
  {
    area: 'environmental',
    title: 'Environmental / Regulatory Impact',
    description: 'Permits, emissions, wastewater, waste, noise, odor, notifications, compliance, and monitoring impacts.',
    fields: [
      { key: 'environmentalImpactAffected', label: 'Environmental impact affected?', required: true },
      { key: 'permitLicenseAffected', label: 'Permit/license affected?' },
      { key: 'emissionsAffected', label: 'Emissions affected?' },
      { key: 'wastewaterAffected', label: 'Wastewater affected?' },
      { key: 'wasteGenerationAffected', label: 'Waste generation affected?' },
      { key: 'noiseOdorAffected', label: 'Noise/odor affected?' },
      { key: 'regulatoryNotificationRequired', label: 'Regulatory notification required?' },
      { key: 'complianceReviewRequired', label: 'Compliance review required?' },
      { key: 'environmentalMonitoringRequired', label: 'Environmental monitoring required?' },
      { key: 'managementNotificationRequired', label: 'Management notification required?' }
    ]
  },
  {
    area: 'quality',
    title: 'Quality / Production Impact',
    description: 'Production, quality, throughput, downtime, customer specs, lab testing, commissioning, trials, and planning.',
    fields: [
      { key: 'productionImpactAffected', label: 'Production impact affected?', required: true },
      { key: 'productQualityAffected', label: 'Product quality affected?' },
      { key: 'throughputAffected', label: 'Throughput affected?' },
      { key: 'productionDowntimeRequired', label: 'Production downtime required?' },
      { key: 'customerSpecificationAffected', label: 'Customer specification affected?' },
      { key: 'laboratoryTestingRequired', label: 'Laboratory testing required?' },
      { key: 'commissioningTestRequired', label: 'Commissioning test required?' },
      { key: 'trialRunRequired', label: 'Trial run required?' },
      { key: 'productionPlanningNotified', label: 'Production planning notified?' },
      { key: 'qualityApprovalRequired', label: 'Quality approval required?' }
    ]
  }
];
