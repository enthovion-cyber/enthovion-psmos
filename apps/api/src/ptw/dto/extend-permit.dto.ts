import { IsDateString, IsString } from 'class-validator';

export class ExtendPermitDto {
  @IsDateString()
  newExpiryAt!: string;

  @IsString()
  reason!: string;
}
