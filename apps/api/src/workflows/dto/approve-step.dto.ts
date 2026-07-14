import { IsOptional, IsString, MinLength } from 'class-validator';

export class ApproveStepDto {
  @IsOptional()
  @IsString()
  stepId?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectStepDto {
  @IsOptional()
  @IsString()
  stepId?: string;

  @IsString()
  @MinLength(3)
  comment!: string;
}

export class ReturnStepDto extends RejectStepDto {}
