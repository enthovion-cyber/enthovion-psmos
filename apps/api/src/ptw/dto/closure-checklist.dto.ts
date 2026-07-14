import { IsObject, IsOptional, IsString } from 'class-validator';

export class ClosureChecklistDto {
  @IsObject()
  items!: Record<string, boolean>;

  @IsOptional()
  @IsString()
  verificationNotes?: string;
}
