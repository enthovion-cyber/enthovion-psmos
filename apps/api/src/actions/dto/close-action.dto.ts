import { IsOptional, IsString } from 'class-validator';

export class CloseActionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
