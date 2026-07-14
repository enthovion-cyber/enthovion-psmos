import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  type!: string;

  @IsString()
  module!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  relatedRecordId?: string;

  @IsOptional()
  @IsString()
  relatedRecordType?: string;

  @IsOptional()
  @IsString()
  relatedUrl?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsArray()
  channels?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
