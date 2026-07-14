import { IsOptional, IsString } from 'class-validator';

export class IssuePermitDto {
  @IsOptional()
  @IsString()
  acknowledgement?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
