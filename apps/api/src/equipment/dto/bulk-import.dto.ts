import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { CreateEquipmentDto } from './create-equipment.dto';

export class BulkImportDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentDto)
  rows!: CreateEquipmentDto[];
}
