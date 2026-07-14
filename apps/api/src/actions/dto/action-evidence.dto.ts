import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ActionEvidenceDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(0)
  sizeBytes!: number;

  @IsString()
  storageKey!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
