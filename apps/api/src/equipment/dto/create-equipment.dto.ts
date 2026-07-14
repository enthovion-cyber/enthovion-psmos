import { EquipmentCriticality, EquipmentStatus } from '../../common/types/db.types';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  siteId!: string;

  @IsString()
  unitId!: string;

  @IsOptional()
  @IsString()
  areaId?: string;

  @IsString()
  @MaxLength(48)
  tag!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @MaxLength(80)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  subtype?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  nameplateNumber?: string;

  @IsOptional()
  @IsDateString()
  commissionDate?: string;

  @IsOptional()
  @IsDateString()
  installationDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  fabricationYear?: number;

  @IsOptional()
  @IsString()
  vendorSupplier?: string;

  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  systemName?: string;

  @IsOptional()
  @IsString()
  buildingZone?: string;

  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  criticality?: EquipmentCriticality;

  @IsOptional()
  @IsBoolean()
  safetyCritical?: boolean;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  classification?: string;

  @IsOptional()
  @IsString()
  hazardClass?: string;

  @IsOptional()
  @IsString()
  areaClassification?: string;

  @IsOptional()
  @IsString()
  fluidName?: string;

  @IsOptional()
  @IsString()
  fluidService?: string;

  @IsOptional()
  @IsString()
  phase?: string;

  @IsOptional()
  @IsString()
  sdsReference?: string;

  @IsOptional()
  @IsString()
  exposureLimits?: string;

  @IsOptional()
  @IsString()
  environmentalImpact?: string;

  @IsOptional()
  @IsString()
  toxicityClass?: string;

  @IsOptional()
  @IsString()
  flammabilityClass?: string;

  @IsOptional()
  @IsString()
  corrosivityClass?: string;

  @IsOptional()
  @IsString()
  compositionNotes?: string;

  @IsOptional()
  @IsString()
  processChemistryNotes?: string;

  @IsOptional()
  @IsString()
  designPressure?: string;

  @IsOptional()
  @IsString()
  designPressureUnit?: string;

  @IsOptional()
  @IsString()
  designTemperature?: string;

  @IsOptional()
  @IsString()
  designTemperatureUnit?: string;

  @IsOptional()
  @IsString()
  designFlow?: string;

  @IsOptional()
  @IsString()
  designFlowUnit?: string;

  @IsOptional()
  @IsString()
  designCapacity?: string;

  @IsOptional()
  @IsString()
  designCapacityUnit?: string;

  @IsOptional()
  @IsString()
  materialOfConstruction?: string;

  @IsOptional()
  @IsString()
  corrosionAllowance?: string;

  @IsOptional()
  @IsString()
  designCode?: string;

  @IsOptional()
  @IsString()
  designBasisDocumentRef?: string;

  @IsOptional()
  @IsString()
  operatingPressure?: string;

  @IsOptional()
  @IsString()
  operatingPressureUnit?: string;

  @IsOptional()
  @IsString()
  operatingTemperature?: string;

  @IsOptional()
  @IsString()
  operatingTemperatureUnit?: string;

  @IsOptional()
  @IsString()
  normalFlowRate?: string;

  @IsOptional()
  @IsString()
  flowUnit?: string;

  @IsOptional()
  @IsString()
  normalCapacityLoad?: string;

  @IsOptional()
  @IsString()
  capacityUnit?: string;

  @IsOptional()
  @IsString()
  operatingMode?: string;

  @IsOptional()
  @IsString()
  operatingDuty?: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  fluidPhase?: string;

  @IsOptional()
  @IsBoolean()
  lotoRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  confinedSpace?: boolean;

  @IsOptional()
  @IsBoolean()
  hotWorkRestrictedArea?: boolean;

  @IsOptional()
  @IsBoolean()
  psvProtected?: boolean;

  @IsOptional()
  @IsString()
  psvTag?: string;

  @IsOptional()
  @IsBoolean()
  sisProtected?: boolean;

  @IsOptional()
  @IsString()
  sisFunctionTag?: string;

  @IsOptional()
  @IsBoolean()
  esdValveAssociated?: boolean;

  @IsOptional()
  @IsString()
  esdValveTag?: string;

  @IsOptional()
  @IsString()
  alarmTags?: string;

  @IsOptional()
  @IsString()
  interlockTags?: string;

  @IsOptional()
  @IsString()
  hazardousAreaClassification?: string;

  @IsOptional()
  @IsString()
  mechanicalIntegrityCategory?: string;

  @IsOptional()
  @IsString()
  inspectionCategory?: string;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  rbiPriority?: EquipmentCriticality;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  maintenancePriority?: EquipmentCriticality;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  environmentalCriticality?: EquipmentCriticality;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  productionCriticality?: EquipmentCriticality;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
