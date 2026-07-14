import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GasReadingDto {
  @IsString()
  gasCode!: string;

  @IsOptional()
  @IsString()
  gasName?: string;

  @Type(() => Number)
  @IsNumber()
  value!: number;

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
}

export class AddGasTestDto {
  @IsOptional()
  @IsIn(['Initial', 'Periodic Re-test', 'After Break', 'Before Hot Work', 'Before Confined Space Entry', 'After Alarm', 'Manual'])
  testType?: string;

  @IsOptional()
  @IsString()
  testLocation?: string;

  @IsOptional()
  @IsDateString()
  testedAt?: string;

  @IsOptional()
  @IsString()
  testerId?: string;

  @IsOptional()
  @IsString()
  testerName?: string;

  @IsOptional()
  @IsString()
  instrumentId?: string;

  @IsOptional()
  @IsString()
  instrumentSerialNumber?: string;

  @IsOptional()
  @IsDateString()
  calibrationDate?: string;

  @IsOptional()
  @IsDateString()
  calibrationDueDate?: string;

  @IsOptional()
  @IsDateString()
  calibrationExpiryDate?: string;

  @IsOptional()
  @IsString()
  ventilationStatus?: string;

  @IsOptional()
  @IsString()
  weatherCondition?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  o2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  h2s?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  co?: number;

  @IsOptional()
  @IsObject()
  customGases?: Record<string, number>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GasReadingDto)
  readings?: GasReadingDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLatitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLongitude?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
