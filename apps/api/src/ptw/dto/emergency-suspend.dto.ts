import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum EmergencyAlarmType {
  GAS_RELEASE = 'GAS_RELEASE',
  FIRE_ALARM = 'FIRE_ALARM',
  PROCESS_UPSET = 'PROCESS_UPSET',
  PLANT_ESD = 'PLANT_ESD',
  SEVERE_WEATHER = 'SEVERE_WEATHER',
  OTHER = 'OTHER'
}

export class EmergencySuspendDto {
  @ApiProperty({ description: 'Target Site ID where emergency occurs' })
  @IsString()
  @IsNotEmpty()
  siteId!: string;

  @ApiPropertyOptional({ description: 'Target Unit ID to restrict scope' })
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Target Area ID to restrict scope' })
  @IsString()
  @IsOptional()
  areaId?: string;

  @ApiProperty({ description: 'Official emergency reason and description' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({ enum: EmergencyAlarmType, default: EmergencyAlarmType.PLANT_ESD })
  @IsEnum(EmergencyAlarmType)
  @IsOptional()
  alarmType?: EmergencyAlarmType = EmergencyAlarmType.PLANT_ESD;

  @ApiPropertyOptional({ description: 'Whether to notify all active workforce via push/SMS/email' })
  @IsOptional()
  broadcastAlert?: boolean = true;
}
