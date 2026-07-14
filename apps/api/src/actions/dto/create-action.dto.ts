import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateActionDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsString()
  sourceModule!: string;

  @IsString()
  sourceRecordId!: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsOptional()
  @IsString()
  siteId?: string | undefined;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsString()
  ownerId!: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'SAFETY_CRITICAL'])
  priority!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsBoolean()
  evidenceRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  verificationRequired?: boolean;
}
