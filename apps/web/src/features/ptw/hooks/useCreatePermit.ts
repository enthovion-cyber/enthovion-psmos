import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ptwService } from '@/services/ptw.service';
import type { PermitCreateValues } from '../schemas/permit.schema';

type CreateMode = 'draft' | 'submit';

export function useCreatePermit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ values, mode }: { values: PermitCreateValues; mode: CreateMode }) => {
      const permit = await ptwService.create({
        siteId: values.siteId,
        unitId: values.unitId,
        areaId: values.areaId,
        permitType: values.permitType,
        title: values.title,
        workDescription: values.detailedWorkDescription || values.description || values.title,
        riskLevel: values.riskLevel === 'Safety-Critical' ? 'High' : values.riskLevel,
        equipmentId: values.equipmentId,
        location: values.locationDescription,
        jobArea: values.area,
        plannedStartAt: new Date(values.plannedStartAt).toISOString(),
        plannedEndAt: new Date(values.plannedEndAt).toISOString(),
        holderId: asRecordId(values.permitHolder),
        areaAuthorityId: asRecordId(values.areaAuthority),
        contractorCompanyId: asRecordId(values.contractorCompanyId),
        maxPersonnel: values.maxPersonnel,
        requiredControls: buildRequiredControls(values),
        typeSpecificData: buildTypeSpecificData(values)
      } as any);

      for (const point of values.isolationPoints) {
        const isolationInput: { energyType: string; sourceDescription: string; isolationPoint: string; valveTag?: string; requiredPosition?: string; lockNumber?: string; lockHolder?: string } = {
          energyType: point.energyType,
          sourceDescription: values.isolationPlanDescription || point.notes || point.isolationPointTag,
          isolationPoint: point.isolationPointTag,
          requiredPosition: point.requiredPosition
        };
        if (point.valveOrBreakerTag) isolationInput.valveTag = point.valveOrBreakerTag;
        if (point.lockNumber) isolationInput.lockNumber = point.lockNumber;
        if (point.holderName) isolationInput.lockHolder = point.holderName;
        await ptwService.addIsolation(permit.id, isolationInput);
      }

      for (const worker of values.workers) {
        const workerInput: { workerName: string; company?: string; trade?: string; role?: string; phone?: string; badgeId?: string; signedBriefing?: boolean } = {
          workerName: worker.workerName,
          role: worker.briefingRequired ? 'Briefing Required' : 'Worker'
        };
        if (worker.briefingCompleted !== undefined) workerInput.signedBriefing = worker.briefingCompleted;
        if (worker.company) workerInput.company = worker.company;
        if (worker.trade) workerInput.trade = worker.trade;
        if (worker.contactNumber) workerInput.phone = worker.contactNumber;
        if (worker.badgeId) workerInput.badgeId = worker.badgeId;
        await ptwService.addWorkforce(permit.id, workerInput);
      }

      for (const attachment of values.attachments) {
        if (attachment.file instanceof File) {
          await ptwService.addAttachment(permit.id, {
            file: attachment.file,
            title: attachment.attachmentType,
            fileName: attachment.fileName,
            mimeType: attachment.file.type || 'application/octet-stream',
            sizeBytes: attachment.file.size
          });
        }
      }

      const finalPermit = mode === 'submit' ? await ptwService.submit(permit.id) : permit;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ptw'] }),
        values.equipmentId ? queryClient.invalidateQueries({ queryKey: ['equipment', values.equipmentId] }) : Promise.resolve(),
        values.equipmentId ? queryClient.invalidateQueries({ queryKey: ['equipment', values.equipmentId, 'linked-records'] }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ['search'] })
      ]);
      return finalPermit;
    }
  });
}

function buildRequiredControls(values: PermitCreateValues) {
  return {
    workOrderNumber: values.workOrderNumber,
    jobNumber: values.jobNumber,
    priority: values.priority,
    shift: values.shift,
    jobSafetyAnalysisRequired: values.jsaRequired,
    fireWatchRequired: values.fireWatchRequired,
    rescuePlanRequired: values.rescuePlanRequired,
    gasTestRequired: values.gasTestRequired,
    initialGasTestRequiredBeforeActivation: values.initialGasTestRequiredBeforeActivation,
    isolationRequired: values.isolationRequired || values.permitType === 'ELECTRICAL_ISOLATION',
    briefingRequired: values.workers.some((worker) => worker.briefingRequired),
    missingRequirementsChecklist: missingRequirements(values)
  };
}

function buildTypeSpecificData(values: PermitCreateValues) {
  return {
    basicPermitInformation: pick(values, ['description', 'workOrderNumber', 'jobNumber', 'permitDuration', 'shift', 'company', 'sitePlant']),
    workLocationEquipment: pick(values, ['department', 'processUnit', 'area', 'locationDescription', 'gpsLatitude', 'gpsLongitude', 'equipmentTag', 'equipmentName', 'equipmentType', 'equipmentCriticality', 'linkedEquipmentTags', 'nearbyEquipment', 'locationMapReference']),
    workDescriptionJobScope: pick(values, ['workMethod', 'toolsEquipmentRequired', 'chemicalsMaterialsUsed', 'sopReference', 'pidReference', 'drawingsReference', 'specialInstructions', 'energyElectrical', 'energyMechanical', 'energyPneumatic', 'energyHydraulic', 'energyThermal', 'energyChemical', 'energyGravitational']),
    permitTypeSpecificRequirements: pick(values, [
      'ignitionSourceType', 'fireWatchName', 'fireExtinguisherAvailable', 'combustiblesRemoved', 'areaBarricaded', 'hotWorkGasTestRequired', 'lelRequirement',
      'confinedSpaceId', 'entrySupervisor', 'attendant', 'entrants', 'rescuePlanDocument', 'ventilationRequired', 'atmosphericTestingRequired', 'communicationMethod', 'retrievalEquipmentAvailable',
      'typeIsolationRequired', 'isolationAuthorityType', 'lockBoxRequired', 'multipleLocksRequired', 'electricalDrawingReference', 'energyIsolationPlanRequired',
      'excavationDepth', 'buriedServicesChecked', 'excavationDrawing', 'soilCondition', 'shoringRequired', 'barricadeRequired', 'gasLineCableClearance',
      'radiationSource', 'exclusionZoneRadius', 'radiationSurveyRequired', 'radiationMonitor', 'warningSignsPosted', 'areaEvacuationRequired',
      'workHeight', 'fallProtectionRequired', 'harnessInspectionCompleted', 'anchorPointVerified', 'scaffoldTagNumber', 'ladderInspectionCompleted',
      'lineEquipmentNumber', 'depressurisedConfirmed', 'drainedConfirmed', 'flushedConfirmed', 'purgedConfirmed', 'blindInstalled', 'residualChemicalHazard', 'ppeRequirement',
      'concurrentWorkDescription', 'nearbyActivePermits', 'simopsCoordinator', 'conflictReviewRequired', 'controlMeasures'
    ]),
    isolationPlan: pick(values, ['isolationPlanDescription', 'isolationAuthority', 'isolationEnergySources', 'isolationPoints']),
    gasTestPlan: pick(values, ['retestInterval', 'gasTester', 'instrumentId', 'instrumentCalibrationDate', 'gasO2', 'gasLEL', 'gasH2S', 'gasCO', 'gasSO2', 'gasCl2', 'gasNH3', 'gasHF', 'customGas', 'thresholdO2', 'thresholdLEL', 'thresholdH2S', 'thresholdCO', 'thresholdCustomGas']),
    workforceContractors: pick(values, ['permitHolder', 'performingAuthority', 'permitIssuer', 'areaAuthority', 'contractorCompany', 'supervisor', 'maxPersonnel', 'workers']),
    supportingDocuments: values.attachments.map(({ file, ...attachment }) => attachment)
  };
}

export function missingRequirements(values: PermitCreateValues) {
  const missing: string[] = [];
  if (!values.permitType) missing.push('Permit Type required');
  if (!values.title) missing.push('Title required');
  if (!values.siteId) missing.push('Site required');
  if (!values.areaId) missing.push('Area required');
  if (!values.locationDescription) missing.push('Work Location Description required');
  if (!values.detailedWorkDescription) missing.push('Detailed Work Description required');
  if (!values.workMethod) missing.push('Work Method required');
  if ((values.isolationRequired || values.permitType === 'ELECTRICAL_ISOLATION') && values.isolationPoints.length < 1) missing.push('At least one isolation point is required');
  if (['HOT_WORK', 'CONFINED_SPACE'].includes(values.permitType) && !values.gasTestRequired) missing.push('Gas test required');
  if (values.gasTestRequired && !values.gasTester) missing.push('Gas tester required if gas test required');
  if (!values.permitHolder) missing.push('Permit Holder required');
  if (!values.performingAuthority) missing.push('Performing Authority required');
  if (!values.areaAuthority) missing.push('Area Authority required');
  if (values.workers.length < 1) missing.push('At least one worker required');
  return missing;
}

function pick<T extends Record<string, unknown>>(source: T, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, source[key]]).filter(([, value]) => value !== undefined && value !== ''));
}

function asRecordId(value?: string) {
  const next = value?.trim();
  if (!next) return undefined;
  return /^(eq_|site_|unit_|area_|user_|contractor_|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.test(next) ? next : undefined;
}
