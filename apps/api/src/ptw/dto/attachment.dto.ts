import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PermitAttachmentDto {
  @IsString()
  title!: string;

  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  attachmentType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  relatedSection?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isEvidence?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsString()
  reviewDate?: string;
}

export class AttachmentRequirementDto {
  @IsOptional()
  @IsString()
  permitType?: string;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsString()
  attachmentType!: string;

  @IsOptional()
  conditionRule?: Record<string, unknown>;

  @IsBoolean()
  isRequired!: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class LinkDocumentAttachmentDto {
  @IsString()
  documentId!: string;

  @IsOptional()
  @IsString()
  documentVersionId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  attachmentType?: string;
}

export class PermitHistoryFilterDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  event_type?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  safety_critical?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
