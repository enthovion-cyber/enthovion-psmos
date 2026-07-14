import { IsObject, IsOptional, IsString } from 'class-validator';

export class StartWorkflowDto {
  @IsString()
  module!: string;

  @IsString()
  recordId!: string;

  @IsString()
  recordNumber!: string;

  @IsString()
  siteId!: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  workflowTemplateId?: string;

  @IsOptional()
  @IsObject()
  contextData?: Record<string, unknown>;
}
