import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthEmailTemplateService } from './auth-email-template.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthSecurityEventService } from './auth-security-event.service';
import { AuthSessionService } from './auth-session.service';
import { AuthService } from './auth.service';
import { CompanyDomainAuthService } from './company-domain-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SignupService } from './signup.service';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule, PermissionsModule, SupabaseModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthService, SignupService, JwtStrategy, AuthSessionService, AuthSecurityEventService, AuthRateLimitService, AuthGoogleService, CompanyDomainAuthService, AuthEmailTemplateService],
  exports: [AuthService]
})
export class AuthModule {}
