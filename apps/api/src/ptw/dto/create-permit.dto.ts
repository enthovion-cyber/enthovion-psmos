import { IsDateString, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreatePermitDto {
  @IsString()
  siteId!: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsString()
  permitType!: string;

  @IsString()
  title!: string;

  @IsString()
  workDescription!: string;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  jobArea?: string;

  @IsOptional()
  @IsString()
  holderId?: string;

  @IsOptional()
  @IsString()
  areaAuthorityId?: string;

  @IsOptional()
  @IsString()
  contractorCompanyId?: string;

  @IsDateString()
  plannedStartAt!: string;

  @IsDateString()
  plannedEndAt!: string;

  @IsOptional()
  @IsObject()
  requiredControls?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  typeSpecificData?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxPersonnel?: number;
}
