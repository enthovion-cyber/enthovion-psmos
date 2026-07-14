import { IsOptional, IsString } from 'class-validator';

export class UserSiteAccessDto {
  @IsString()
  siteId!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  areaId?: string;
}
