import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationPreferenceDto {
  @IsString()
  module!: string;

  @IsString()
  eventType!: string;

  @IsBoolean()
  inAppEnabled!: boolean;

  @IsBoolean()
  emailEnabled!: boolean;

  @IsBoolean()
  smsEnabled!: boolean;

  @IsBoolean()
  digestEnabled!: boolean;
}

export class UpdatePreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceDto)
  preferences!: NotificationPreferenceDto[];
}
