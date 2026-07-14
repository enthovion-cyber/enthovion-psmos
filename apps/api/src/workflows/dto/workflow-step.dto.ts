import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class WorkflowStepDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  stepName!: string;

  @IsOptional()
  @IsString()
  stepType?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sequence!: number;

  @IsOptional()
  @IsString()
  assignedRoleId?: string;

  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  assignedDepartmentId?: string;

  @IsOptional()
  @IsString()
  approvalMode?: string;

  @IsOptional()
  @IsString()
  parallelGroup?: string;

  @IsOptional()
  @IsObject()
  conditionRule?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  slaHours?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  canReject?: boolean;

  @IsOptional()
  @IsBoolean()
  canOverride?: boolean;
}
