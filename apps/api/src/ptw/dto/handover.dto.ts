import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class HandoverDto {
  @IsString()
  outgoingShift!: string;

  @IsString()
  incomingShift!: string;

  @IsOptional()
  @IsString()
  outgoingSupervisorId?: string;

  @IsOptional()
  @IsString()
  incomingSupervisorId?: string;

  @IsOptional()
  @IsObject()
  checklist?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  acknowledgement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLatitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLongitude?: number;
}
