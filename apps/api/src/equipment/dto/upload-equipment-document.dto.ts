import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UploadEquipmentDocumentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  documentNo?: string;

  @IsString()
  documentType!: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  storageKey?: string;
}
