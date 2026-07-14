import { IsObject, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
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
  roleName?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
