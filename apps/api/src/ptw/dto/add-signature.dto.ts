import { IsOptional, IsString } from 'class-validator';

export class AddSignatureDto {
  @IsString()
  signatureType!: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
