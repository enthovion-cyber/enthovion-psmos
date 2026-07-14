import { IsOptional, IsString } from 'class-validator';

export class UserRoleDto {
  @IsString()
  roleId!: string;

  @IsOptional()
  @IsString()
  scopeType?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;
}
