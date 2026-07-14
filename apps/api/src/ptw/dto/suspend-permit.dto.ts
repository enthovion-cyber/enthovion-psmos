import { IsString } from 'class-validator';

export class SuspendPermitDto {
  @IsString()
  reason!: string;
}
