import { PartialType } from '@nestjs/swagger';
import { CreateEquipmentInspectionDto } from './create-equipment-inspection.dto';

export class UpdateEquipmentInspectionDto extends PartialType(CreateEquipmentInspectionDto) {}
