import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class SignatureProfileDto {
  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsIn(['Draw', 'Type', 'Upload', 'Initials'])
  signatureMethod!: 'Draw' | 'Type' | 'Upload' | 'Initials';

  @IsOptional()
  @IsString()
  signatureText?: string;

  @IsOptional()
  @IsString()
  signatureImageKey?: string;

  @IsOptional()
  @IsString()
  signatureImageUrl?: string;

  @IsOptional()
  @IsObject()
  signatureVectorJson?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  initials?: string;

  @IsOptional()
  @IsObject()
  styleConfig?: Record<string, unknown>;
}
