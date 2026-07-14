import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateWorkforceDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  workerName?: string;

  @IsOptional()
  @IsIn(['Internal', 'Contractor', 'Visitor'])
  workerType?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  employerCompany?: string;

  @IsOptional()
  @IsString()
  contractorCompanyId?: string;

  @IsOptional()
  @IsString()
  trade?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  contactNumber?: string;

  @IsOptional()
  @IsString()
  badgeId?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  roleOnPermit?: string;

  @IsOptional()
  @IsBoolean()
  isPermitHolder?: boolean;

  @IsOptional()
  @IsBoolean()
  isPerformingAuthority?: boolean;

  @IsOptional()
  @IsBoolean()
  isAreaAuthority?: boolean;

  @IsOptional()
  @IsBoolean()
  isPermitIssuer?: boolean;

  @IsOptional()
  @IsBoolean()
  isFireWatch?: boolean;

  @IsOptional()
  @IsBoolean()
  isAttendant?: boolean;

  @IsOptional()
  @IsBoolean()
  isEntrySupervisor?: boolean;

  @IsOptional()
  @IsBoolean()
  isGasTester?: boolean;

  @IsOptional()
  @IsBoolean()
  isIsolationAuthority?: boolean;

  @IsOptional()
  @IsBoolean()
  briefingRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  signedBriefing?: boolean;

  @IsOptional()
  @IsBoolean()
  briefingCompleted?: boolean;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsDateString()
  timeIn?: string | null;

  @IsOptional()
  @IsDateString()
  timeOut?: string | null;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
