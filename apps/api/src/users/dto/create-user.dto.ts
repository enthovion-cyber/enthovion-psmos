import { IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsIn(['Employee', 'Contractor', 'Vendor', 'Auditor'])
  employerType?: string;

  @IsOptional()
  @IsString()
  contractorCompanyId?: string;

  @IsOptional()
  @IsArray()
  companyIds?: string[];

  @IsOptional()
  @IsArray()
  siteIds?: string[];

  @IsOptional()
  @IsArray()
  unitIds?: string[];

  @IsOptional()
  @IsArray()
  areaIds?: string[];

  @IsOptional()
  @IsArray()
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  permissionKeys?: string[];

  @IsOptional()
  @IsIn(['work', 'personal', 'both', 'none'])
  sendTo?: 'work' | 'personal' | 'both' | 'none';

  @IsOptional()
  @IsIn(['invite', 'generated_password', 'sso'])
  authMethod?: 'invite' | 'generated_password' | 'sso';

  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean;

  @IsOptional()
  @IsBoolean()
  mfaRequired?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(12)
  password?: string;
}
