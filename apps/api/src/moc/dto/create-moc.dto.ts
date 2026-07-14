import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const changeTypes = ['Permanent Process Change', 'Temporary Change', 'Emergency Change', 'Like-for-Like Replacement', 'Organizational Change', 'Document / Procedure Change', 'Software Change'];
const changeCategories = ['Process', 'Equipment', 'Chemical', 'Procedure', 'Operating Limit', 'Safety System', 'Organization', 'Software / Control System', 'Document', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Safety-Critical'];

export class MocRiskDto {
  @IsInt()
  @Min(0)
  @Max(3)
  safetyImpact!: number;

  @IsInt()
  @Min(0)
  @Max(3)
  environmentalImpact!: number;

  @IsInt()
  @Min(0)
  @Max(3)
  productionImpact!: number;
}

export class MocEngineeringDocumentDto {
  @IsString()
  documentType!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}

export class MocTemporaryControlsDto {
  @IsDateString()
  expiryDate!: string;
  @IsInt()
  durationDays!: number;
  @IsString()
  reason!: string;
  @IsString()
  riskControls!: string;
  @IsString()
  reversalPlan!: string;
  @IsOptional()
  @IsString()
  removalOwnerId?: string;
  @IsOptional()
  @IsBoolean()
  extensionAllowed?: boolean;
}

export class MocEmergencyControlsDto {
  @IsString()
  emergencyJustification!: string;
  @IsString()
  immediateRiskControls!: string;
  @IsOptional()
  @IsString()
  implementedBy?: string;
  @IsDateString()
  implementationDateTime!: string;
  @IsDateString()
  postReviewDueDate!: string;
}

export class CreateMocDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsIn(changeTypes)
  changeType?: string;
  @IsOptional()
  @IsIn(changeCategories)
  changeCategory?: string;
  @IsOptional()
  @IsIn(priorities)
  priority?: string;
  @IsString()
  siteId!: string;
  @IsOptional()
  @IsString()
  companyId?: string;
  @IsOptional()
  @IsString()
  departmentId?: string;
  @IsOptional()
  @IsString()
  unitId?: string;
  @IsOptional()
  @IsString()
  areaId?: string;
  @IsOptional()
  @IsDateString()
  requestedStartDate?: string;
  @IsOptional()
  @IsDateString()
  targetImplementationDate?: string;
  @IsOptional()
  @IsString()
  originatorId?: string;
  @IsOptional()
  @IsString({ each: true })
  equipmentIds?: string[];
  @IsOptional()
  @IsString()
  primaryEquipmentId?: string;
  @IsOptional()
  @IsString()
  affectedSystem?: string;
  @IsOptional()
  @IsString()
  locationDescription?: string;
  @IsOptional()
  @IsObject()
  changeDescription?: Record<string, unknown>;
  @IsOptional()
  @ValidateNested()
  @Type(() => MocRiskDto)
  risk?: MocRiskDto;
  @IsOptional()
  @IsObject()
  impactAssessment?: Record<string, unknown>;
  @IsOptional()
  @ValidateNested()
  @Type(() => MocTemporaryControlsDto)
  temporaryControls?: MocTemporaryControlsDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => MocEmergencyControlsDto)
  emergencyControls?: MocEmergencyControlsDto;
  @IsOptional()
  @IsObject()
  likeForLike?: Record<string, unknown>;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MocEngineeringDocumentDto)
  engineeringDocuments?: MocEngineeringDocumentDto[];
  @IsOptional()
  @IsArray()
  additionalActions?: Array<Record<string, unknown>>;
}
