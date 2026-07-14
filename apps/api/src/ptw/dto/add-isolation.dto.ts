import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AddIsolationDto {
  @IsString()
  energyType!: string;

  @IsOptional()
  @IsString()
  sourceDescription?: string;

  @IsString()
  isolationPoint!: string;

  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsOptional()
  @IsString()
  equipmentTag?: string;

  @IsOptional()
  @IsString()
  isolationPointTag?: string;

  @IsOptional()
  @IsString()
  isolationPointDescription?: string;

  @IsOptional()
  @IsString()
  valveTag?: string;

  @IsOptional()
  @IsString()
  breakerTag?: string;

  @IsOptional()
  @IsString()
  blindSpadeNumber?: string;

  @IsOptional()
  @IsString()
  requiredPosition?: string;

  @IsOptional()
  @IsString()
  normalPosition?: string;

  @IsOptional()
  @IsString()
  currentPosition?: string;

  @IsOptional()
  @IsString()
  lockNumber?: string;

  @IsOptional()
  @IsString()
  lockHolder?: string;

  @IsOptional()
  @IsString()
  lockHolderName?: string;

  @IsOptional()
  @IsString()
  lockHolderUserId?: string;

  @IsOptional()
  @IsString()
  isolationMethod?: string;

  @IsOptional()
  @IsBoolean()
  verificationRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  secondPersonVerificationRequired?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
