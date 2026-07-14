import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class SignatureRequirementDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsString()
  moduleName!: string;

  @IsString()
  recordType!: string;

  @IsString()
  actionType!: string;

  @IsString()
  signatureRole!: string;

  @IsOptional()
  @IsString()
  requiredPermission?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  sequenceOrder?: number;

  @IsOptional()
  @IsBoolean()
  canDelegate?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresIndependentSigner?: boolean;

  @IsOptional()
  @IsBoolean()
  blocksActionUntilSigned?: boolean;

  @IsOptional()
  @IsString()
  declarationText?: string;
}

export class SignElectronicSignatureDto {
  @IsString()
  moduleName!: string;

  @IsString()
  recordType!: string;

  @IsString()
  recordId!: string;

  @IsOptional()
  @IsString()
  recordNumber?: string;

  @IsString()
  actionType!: string;

  @IsString()
  signatureRole!: string;

  @IsOptional()
  @IsString()
  declarationText?: string;

  @IsIn(['password', 'pin'])
  authMethod!: 'password' | 'pin';

  @IsString()
  usernameReentry!: string;

  @IsString()
  passwordOrPin!: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  recordHashBeforeSigning?: string;
}

export class RejectElectronicSignatureDto {
  @IsString()
  moduleName!: string;

  @IsString()
  recordType!: string;

  @IsString()
  recordId!: string;

  @IsString()
  actionType!: string;

  @IsString()
  signatureRole!: string;

  @IsString()
  rejectionReason!: string;
}

export class ValidateBeforeActionDto {
  @IsString()
  moduleName!: string;

  @IsString()
  recordType!: string;

  @IsString()
  recordId!: string;

  @IsString()
  actionType!: string;
}
