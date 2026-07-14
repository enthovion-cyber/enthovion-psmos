import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MaxLength(80)
  key!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(['GLOBAL', 'TENANT', 'COMPANY', 'SITE', 'UNIT', 'AREA', 'MODULE', 'RECORD'])
  scopeType?: string;

  @IsOptional()
  @IsBoolean()
  systemRole?: boolean;
}
