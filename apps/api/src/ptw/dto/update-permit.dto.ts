import { CreatePermitDto } from './create-permit.dto';
import { IsDateString, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePermitDto implements Partial<CreatePermitDto> {
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsOptional()
  @IsString()
  permitType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  workDescription?: string;

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

  @IsOptional()
  @IsDateString()
  plannedStartAt?: string;

  @IsOptional()
  @IsDateString()
  plannedEndAt?: string;

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
