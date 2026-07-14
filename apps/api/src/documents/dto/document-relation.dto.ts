import { IsOptional, IsString } from 'class-validator';

export class DocumentRelationDto {
  @IsString() relatedModule!: string;
  @IsString() relatedRecordId!: string;
  @IsOptional() @IsString() equipmentId?: string;
  @IsOptional() @IsString() relationType?: string;
}
