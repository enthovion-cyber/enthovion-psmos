import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class BulkImportUserRowDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  roles?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  sites?: string;

  @IsOptional()
  @IsString()
  units?: string;

  @IsOptional()
  @IsString()
  areas?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  employerType?: string;

  @IsOptional()
  @IsString()
  contractorCompany?: string;

  @IsOptional()
  @IsString()
  modulePermissions?: string;

  @IsOptional()
  @IsString()
  sendInviteTo?: string;

  @IsOptional()
  @IsBoolean()
  generatePassword?: boolean;

  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(12)
  password?: string;
}

export class BulkImportUsersDto {
  @IsOptional()
  @IsString()
  fileName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportUserRowDto)
  users!: BulkImportUserRowDto[];
}
