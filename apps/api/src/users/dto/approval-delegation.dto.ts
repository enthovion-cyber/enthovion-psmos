import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ApprovalDelegationDto {
  @IsString()
  delegateId!: string;

  @IsOptional()
  @IsString()
  moduleKey?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}
