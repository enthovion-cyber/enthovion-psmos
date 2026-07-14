import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class WorkforceBriefingDto {
  @IsString()
  briefingTitle!: string;

  @IsString()
  briefingTopic!: string;

  @IsOptional()
  @IsString()
  briefingNotes?: string;

  @IsOptional()
  @IsString()
  conductedBy?: string;

  @IsOptional()
  @IsDateString()
  conductedAt?: string;

  @IsOptional()
  @IsBoolean()
  requiredForAllWorkers?: boolean;
}

export class WorkerBriefingDto {
  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class WorkforceBulkDto {
  @IsOptional()
  workerIds?: string[];
}

export class WorkforceAccountabilityDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  confirmedBy?: string;
}
