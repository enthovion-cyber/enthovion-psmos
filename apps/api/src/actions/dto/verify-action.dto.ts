import { IsIn, IsOptional, IsString } from 'class-validator';

export class VerifyActionDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  notes?: string;
}
