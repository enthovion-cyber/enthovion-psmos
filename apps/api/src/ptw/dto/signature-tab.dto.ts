import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SignPermitSignatureDto {
  @IsBoolean()
  confirmed!: boolean;

  @IsString()
  electronicSignature!: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class RejectPermitSignatureDto {
  @IsString()
  rejectionReason!: string;

  @IsOptional()
  @IsString()
  correctionRequired?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class SignatureRequirementDto {
  @IsOptional()
  @IsString()
  permitType?: string;

  @IsOptional()
  @IsString()
  riskLevel?: string;

  @IsOptional()
  @IsString()
  areaClassification?: string;

  @IsOptional()
  @IsString()
  equipmentCriticality?: string;

  @IsString()
  signatureRole!: string;

  @IsString()
  signaturePurpose!: string;

  @IsString()
  requiredForStatus!: string;

  @IsOptional()
  @IsString()
  assignedRoleId?: string;

  @IsBoolean()
  isRequired!: boolean;

  @IsOptional()
  conditionRule?: Record<string, unknown>;

  @IsBoolean()
  expiresOnExtension!: boolean;

  @IsBoolean()
  requiresRevalidation!: boolean;
}
