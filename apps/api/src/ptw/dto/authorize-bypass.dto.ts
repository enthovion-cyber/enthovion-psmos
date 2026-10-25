import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthorizeBypassDto {
  @ApiProperty({ description: 'Certificate number for the interlock / SCE bypass' })
  @IsString()
  @IsNotEmpty()
  bypassCertificateNumber!: string;

  @ApiProperty({ description: 'Technical justification and mitigation safeguards for bypassing SCE' })
  @IsString()
  @IsNotEmpty()
  bypassReason!: string;

  @ApiPropertyOptional({ description: 'Assigned SIL rating if applicable (e.g. SIL-1, SIL-2, SIL-3)' })
  @IsString()
  @IsOptional()
  silRating?: string;

  @ApiPropertyOptional({ description: 'Associated SIF loop or interlock tag' })
  @IsString()
  @IsOptional()
  sifTag?: string;

  @ApiPropertyOptional({ description: 'Risk assessment document reference or attachment ID' })
  @IsString()
  @IsOptional()
  riskAssessmentReference?: string;

  @ApiPropertyOptional({ description: 'Digital e-signature token or cryptographic hash' })
  @IsString()
  @IsOptional()
  signature?: string;
}
