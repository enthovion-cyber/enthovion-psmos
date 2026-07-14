import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePermitTemplateDto {
  @IsString()
  permitType!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsObject()
  templateData!: Record<string, unknown>;
}
