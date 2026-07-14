import { IsString, MinLength } from 'class-validator';

export class OverrideWorkflowDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}
