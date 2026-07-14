import { IsDateString, IsOptional, IsString } from 'class-validator';

export class PermitFilterDto {
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
  status?: string;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  contractorCompanyId?: string;

  @IsOptional()
  @IsString()
  issuerId?: string;

  @IsOptional()
  @IsString()
  holderId?: string;

  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  expiringWithin?: string;

  @IsOptional()
  @IsString()
  hasConflict?: string;

  @IsOptional()
  @IsString()
  gasRetestDue?: string;

  @IsOptional()
  @IsString()
  isolationPending?: string;

  @IsOptional()
  @IsString()
  handoverPending?: string;
}
