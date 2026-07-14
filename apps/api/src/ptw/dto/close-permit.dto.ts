import { IsOptional, IsString } from 'class-validator';

export class ClosePermitDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  overrideReason?: string;
}
