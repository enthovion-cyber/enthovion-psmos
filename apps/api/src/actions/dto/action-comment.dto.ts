import { IsOptional, IsString, MinLength } from 'class-validator';

export class ActionCommentDto {
  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}
