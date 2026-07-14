import { IsOptional, IsString } from 'class-validator';

export class ConfirmIsolationDto {
  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
