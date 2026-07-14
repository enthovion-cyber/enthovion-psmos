import { IsOptional, IsString } from 'class-validator';

export class NotificationFilterDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}
