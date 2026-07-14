import { IsBoolean, IsEmail, IsIn, IsISO31661Alpha2, IsOptional, IsString, IsTimeZone, Length, Matches, MinLength } from 'class-validator';

export class SignupEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @IsOptional()
  @IsString()
  supabaseUserId?: string;

  @IsOptional()
  @IsString()
  emailRedirectTo?: string;

  @IsOptional()
  @IsIn(['trial', 'checkout', 'enterprise'])
  intent?: 'trial' | 'checkout' | 'enterprise';

  @IsOptional()
  @IsString()
  planCode?: string;
}

export class ResendSignupVerificationDto {
  @IsEmail()
  email!: string;
}

export class SignupStatusQueryDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class AuthPostCallbackDto {
  @IsOptional()
  @IsIn(['login', 'signup', 'invite'])
  flow?: 'login' | 'signup' | 'invite';

  @IsOptional()
  @IsIn(['email', 'google'])
  provider?: 'email' | 'google';

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  providerUserId?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsIn(['trial', 'checkout', 'enterprise'])
  intent?: 'trial' | 'checkout' | 'enterprise';

  @IsOptional()
  @IsString()
  planCode?: string;
}

export class CompleteWorkspaceDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsString()
  @Length(2, 180)
  workspaceName!: string;

  @IsString()
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  workspaceSlug!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsISO31661Alpha2()
  country?: string;

  @IsOptional()
  @IsTimeZone()
  timezone?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  primarySiteName?: string;

  @IsOptional()
  @IsString()
  providerUserId?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsIn(['trial', 'checkout', 'enterprise'])
  intent?: 'trial' | 'checkout' | 'enterprise';

  @IsOptional()
  @IsString()
  planCode?: string;
}

export class StartTrialDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

export class StartCheckoutDto extends StartTrialDto {
  @IsString()
  planCode!: string;
}
