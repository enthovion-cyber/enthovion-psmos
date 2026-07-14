import { EquipmentCriticality, EquipmentStatus } from '../../common/types/db.types';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class EquipmentFilterDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  siteId?: string | undefined;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  areaId?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  criticality?: EquipmentCriticality;
}
