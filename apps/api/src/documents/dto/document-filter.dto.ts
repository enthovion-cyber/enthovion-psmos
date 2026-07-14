import { IsOptional, IsString } from 'class-validator';

export class DocumentFilterDto {
  @IsOptional() @IsString() documentType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() folderId?: string;
  @IsOptional() @IsString() search?: string;
}
