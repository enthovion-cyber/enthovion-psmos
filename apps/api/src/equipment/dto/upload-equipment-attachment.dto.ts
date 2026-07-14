import { IsOptional, IsString } from 'class-validator';

export class UploadEquipmentAttachmentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  attachmentType?: string;

  @IsOptional()
  @IsString()
  inspectionId?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  storageKey?: string;
}
