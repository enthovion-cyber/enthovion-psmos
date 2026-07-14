import { IsOptional, IsString, MinLength } from 'class-validator';

export class DocumentDecisionDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class DocumentRejectDto {
  @IsString()
  @MinLength(3)
  comment!: string;
}

export class DocumentReasonDto {
  @IsString()
  @MinLength(3)
  reason!: string;

  @IsOptional()
  @IsString()
  replacementDocumentId?: string;
}
