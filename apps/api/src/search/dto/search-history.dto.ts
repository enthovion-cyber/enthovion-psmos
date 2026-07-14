import { IsOptional, IsString } from 'class-validator';

export class SearchHistoryDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  selectedRecordId?: string;

  @IsOptional()
  @IsString()
  selectedModule?: string;
}
