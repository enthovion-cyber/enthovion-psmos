import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateConflictDto {
  @IsOptional()
  @IsIn(['Open', 'Under Review', 'Overridden', 'Resolved', 'False Positive', 'Cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class ConflictOverrideDto {
  @IsString()
  justification!: string;

  @IsString()
  requiredControls!: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class ConflictRejectDto {
  @IsString()
  reason!: string;
}

export class SimopsReviewDto {
  @IsBoolean()
  simopsRequired!: boolean;

  @IsOptional()
  @IsString()
  coordinatorId?: string;

  @IsString()
  coordinatorName!: string;

  @IsString()
  concurrentWorkDescription!: string;

  @IsString()
  interactionHazards!: string;

  @IsString()
  requiredControls!: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class SimopsControlDto {
  @IsString()
  controlDescription!: string;

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsIn(['Open', 'In Progress', 'Completed', 'Cancelled'])
  status?: string;
}

export class ConflictMatrixRuleDto {
  @IsString()
  permitTypeA!: string;

  @IsString()
  permitTypeB!: string;

  @IsString()
  conflictType!: string;

  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  severity!: string;

  @IsBoolean()
  blockActivation!: boolean;

  @IsBoolean()
  overrideAllowed!: boolean;

  @IsOptional()
  @IsString()
  requiredControl?: string;

  @IsOptional()
  @IsNumber()
  radiusMeters?: number;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  areaClassification?: string;
}
