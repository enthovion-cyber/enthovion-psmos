import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class SetSignaturePinDto {
  @IsString()
  @Matches(/^\d{4,8}$/)
  pin!: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class ChangeSignaturePinDto {
  @IsString()
  currentPin!: string;

  @IsString()
  @Matches(/^\d{4,8}$/)
  newPin!: string;
}

export class VerifySignaturePinDto {
  @IsString()
  pin!: string;
}

export class ResetSignaturePinDto {
  @IsString()
  @MinLength(12)
  password!: string;
}
