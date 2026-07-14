import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;
}
