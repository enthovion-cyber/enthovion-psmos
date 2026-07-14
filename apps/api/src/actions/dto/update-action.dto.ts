import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateActionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'SAFETY_CRITICAL'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  evidenceRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  verificationRequired?: boolean;
}
