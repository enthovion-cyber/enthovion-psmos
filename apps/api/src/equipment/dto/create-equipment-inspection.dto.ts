import { EquipmentCriticality, InspectionStatus } from '../../common/types/db.types';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateEquipmentInspectionDto {
  @IsString()
  inspectionType!: string;

  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @IsOptional()
  @IsString()
  inspector?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsDateString()
  nextInspectionDate!: string;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  rbiPriority?: EquipmentCriticality;

  @IsOptional()
  @IsString()
  summary?: string;
}
