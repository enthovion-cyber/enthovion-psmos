import { IsOptional, IsString } from 'class-validator';

export class IndexRecordDto {
  @IsString()
  module!: string;

  @IsString()
  recordType!: string;

  @IsString()
  recordId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  recordNumber?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  url?: string;
}
