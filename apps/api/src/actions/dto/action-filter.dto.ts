import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ActionFilterDto {
  @IsOptional()
  @IsString()
  view?: 'mine' | 'assigned-to-me' | 'team' | 'department' | 'all';

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  siteId?: string | undefined;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  moduleKey?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
