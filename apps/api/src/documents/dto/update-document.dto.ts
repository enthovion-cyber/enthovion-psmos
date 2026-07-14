import { IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() documentType?: string;
  @IsOptional() @IsString() siteId?: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() folderId?: string;
  @IsOptional() @IsString() status?: string;
}
