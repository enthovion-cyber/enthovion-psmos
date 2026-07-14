import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GasThresholdDto {
  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  permitType?: string;

  @IsOptional()
  @IsString()
  areaClassification?: string;

  @IsString()
  gasCode!: string;

  @IsOptional()
  @IsString()
  gasName?: string;

  @IsString()
  unit!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  alertLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actionLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  retestIntervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  autoSuspendOnFail?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSuspendOnOverdue?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  policy?: string;
}
