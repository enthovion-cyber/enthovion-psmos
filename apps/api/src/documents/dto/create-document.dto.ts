import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDocumentDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() documentType!: string;
  @IsString() siteId!: string;
  @IsOptional() @IsString() unitId?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsString() ownerId!: string;
  @IsOptional() @IsString() folderId?: string;
  @IsOptional() @IsString() tags?: string;
  @IsOptional() @IsString() relatedEquipmentId?: string;
  @IsOptional() @IsString() relatedModule?: string;
  @IsOptional() @IsString() relatedRecordId?: string;
  @IsOptional() @IsString() relationType?: string;
  @IsOptional() @IsString() changeSummary?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  reviewFrequencyMonths?: number;
}
