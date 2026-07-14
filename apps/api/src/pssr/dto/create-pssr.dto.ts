export class CreatePssrDto {
  title!: string;
  description?: string | undefined;
  pssrType!: string;
  startupType!: string;
  triggerSource?: string | undefined;
  mocId?: string | undefined;
  companyId?: string | undefined;
  siteId!: string;
  departmentId?: string | undefined;
  unitId?: string | undefined;
  areaId?: string | undefined;
  requestedStartupAt?: string | undefined;
  targetStartupAt!: string;
  coordinatorId!: string;
  originatorId?: string | undefined;
  priority?: string | undefined;
  riskLevel?: string | undefined;
  primaryEquipmentId?: string | undefined;
  additionalEquipmentIds?: string[] | undefined;
  systemService?: string | undefined;
  locationDescription?: string | undefined;
  startupScope?: Record<string, any> | undefined;
  startupBoundaries?: string | undefined;
  startupHazards?: string | undefined;
  startupPrerequisites?: string | undefined;
  temporaryControls?: string | undefined;
  submit?: boolean | undefined;
}
