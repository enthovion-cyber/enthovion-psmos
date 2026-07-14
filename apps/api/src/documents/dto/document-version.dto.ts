import { IsString, MinLength } from 'class-validator';

export class DocumentVersionDto {
  @IsString()
  @MinLength(3)
  changeSummary!: string;
}
