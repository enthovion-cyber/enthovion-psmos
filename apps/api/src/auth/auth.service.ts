import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PermissionsService } from '../permissions/permissions.service';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { AuthGoogleService } from './auth-google.service';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthSecurityEventService } from './auth-security-event.service';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly permissions: PermissionsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: AuthSessionService,
    private readonly securityEvents: AuthSecurityEventService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly google: AuthGoogleService
  ) {}

  async login(email: string, password: string, meta?: RequestMeta) {
    const normalizedEmail = email.toLowerCase().trim();
    await this.rateLimit.check('LOGIN', normalizedEmail, meta?.ipAddress, 8);
    const user = await this.users.findByEmail(normalizedEmail);
    if (!user) {
      await this.securityEvents.record({ email: normalizedEmail, provider: 'password', eventType: 'LOGIN_FAILED', success: false, failureReason: 'Invalid credentials', ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (user.status !== 'ACTIVE') {
      await this.securityEvents.record({ tenantId: user.tenantId, userId: user.id, email: normalizedEmail, provider: 'password', eventType: 'DEACTIVATED_USER_LOGIN_BLOCKED', success: false, failureReason: 'Account disabled', ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
      throw new ForbiddenException('Your account is disabled. Contact your company admin.');
    }
    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      await this.securityEvents.record({ tenantId: user.tenantId, userId: user.id, email: normalizedEmail, provider: 'password', eventType: 'LOGIN_FAILED', success: false, failureReason: 'Invalid credentials', ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
      throw new UnauthorizedException('Invalid email or password.');
    }
    const profile = await this.authorizedProfile(user.tenantId, user.id);
    const result = await this.issueTokens(user.id, user.tenantId, profile);
    const requiresPasswordChange = Boolean(profile.profile?.forcePasswordChange);
    await this.securityEvents.record({ tenantId: user.tenantId, userId: user.id, email: normalizedEmail, provider: 'password', eventType: 'LOGIN_SUCCESS', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
    return { ...result, requiresPasswordChange, next: this.nextRoute(profile, requiresPasswordChange) };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; tenantId: string }>(refreshToken, {
        secret: this.config.get<string>('auth.refreshSecret') ?? 'development-refresh-secret'
      });
      const user = await this.users.getById(payload.tenantId, payload.sub);
      if (user.status !== 'ACTIVE') throw new UnauthorizedException('User is not active');
      const profile = await this.authorizedProfile(payload.tenantId, payload.sub);
      return this.issueTokens(payload.sub, payload.tenantId, profile);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId?: string, tenantId?: string, meta?: RequestMeta) {
    if (userId && tenantId) {
      await this.securityEvents.record({ tenantId, userId, eventType: 'LOGOUT', provider: 'password', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
    }
    return { success: true };
  }

  async me(userId: string, tenantId?: string) {
    const profile = await this.users.getProfile(userId);
    if (tenantId && profile.tenantId !== tenantId) throw new UnauthorizedException('Invalid session');
    await this.ensureSessionUsable(userId);
    return profile;
  }

  async session(userId: string, tenantId: string) {
    const profile = await this.authorizedProfile(tenantId, userId);
    const state = await this.sessions.state(userId);
    return { authenticated: true, user: profile, state, next: this.nextRoute(profile, Boolean(profile.profile?.forcePasswordChange)) };
  }

  async validateSession(userId: string, tenantId: string, sessionVersion?: number, permissionVersion?: number) {
    const profile = await this.authorizedProfile(tenantId, userId);
    const validation = await this.sessions.validate(userId, sessionVersion, permissionVersion);
    if (!validation.valid) throw new UnauthorizedException(validation.reason ?? 'Your access changed. Please sign in again.');
    return { valid: true, user: profile, state: validation.state };
  }

  async refreshSession(userId: string, tenantId: string) {
    const profile = await this.authorizedProfile(tenantId, userId);
    const tokens = await this.issueTokens(userId, tenantId, profile);
    await this.securityEvents.record({ tenantId, userId, eventType: 'SESSION_REFRESHED', provider: 'password', success: true });
    return tokens;
  }

  async forceLogoutCurrent(userId: string, tenantId: string, reason?: string) {
    await this.sessions.markStale(userId, reason ?? 'User requested session refresh');
    await this.securityEvents.record({ tenantId, userId, eventType: 'FORCED_LOGOUT', provider: 'password', success: true, failureReason: reason ?? null });
    return { success: true };
  }

  register(dto: RegisterDto) {
    const publicRegistrationEnabled = this.config.get<string>('auth.publicRegistrationEnabled') === 'true' || process.env.AUTH_PUBLIC_REGISTRATION_ENABLED === 'true';
    if (!publicRegistrationEnabled) {
      throw new ForbiddenException('Public self-registration is disabled. Users must be invited or created by an administrator.');
    }
    if (!dto.tenantId) throw new ForbiddenException('Tenant onboarding must create the first company administrator explicitly.');
    return this.users.create(dto.tenantId, 'system', dto);
  }

  acceptInvite(token: string, displayName: string, password: string) {
    return this.users.acceptInvitation(token, displayName, password);
  }

  async forgotPassword(email: string, meta?: RequestMeta) {
    const normalizedEmail = email.toLowerCase().trim();
    await this.rateLimit.check('FORGOT_PASSWORD', normalizedEmail, meta?.ipAddress, 5);
    const result = await this.users.createPasswordReset(normalizedEmail);
    await this.securityEvents.record({ tenantId: (result as any).tenantId ?? null, email: normalizedEmail, provider: 'password', eventType: 'PASSWORD_RESET_REQUESTED', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
    return { success: true, message: 'If this email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, password: string, meta?: RequestMeta) {
    this.assertPasswordPolicy(password);
    const result = await this.users.resetPassword(token, password);
    await this.securityEvents.record({ eventType: 'PASSWORD_RESET_COMPLETED', provider: 'password', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
    return result;
  }

  async forceChangePassword(tenantId: string, userId: string, currentPassword: string | undefined, newPassword: string, meta?: RequestMeta) {
    this.assertPasswordPolicy(newPassword);
    const result = await this.users.changeOwnPassword(tenantId, userId, currentPassword, newPassword);
    await this.securityEvents.record({ tenantId, userId, eventType: 'FORCE_PASSWORD_CHANGE_COMPLETED', provider: 'password', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
    return result;
  }

  googleStart() {
    return this.google.start();
  }

  googleCallback() {
    return { status: 'callback_received', message: 'Complete Google sign-in through the Supabase OAuth callback.' };
  }

  googleComplete(input: { email: string; providerUserId?: string; displayName?: string; avatarUrl?: string }, meta?: RequestMeta) {
    return this.google.complete(input, meta);
  }

  async reportSuspiciousLogin(input: { email?: string; message?: string; eventId?: string }, meta?: RequestMeta) {
    const email = input.email?.toLowerCase().trim() || undefined;
    await this.securityEvents.record({
      email,
      provider: 'password',
      eventType: 'SUSPICIOUS_LOGIN_REPORTED',
      success: true,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: {
        message: input.message ?? null,
        eventId: input.eventId ?? null
      }
    });
    return { success: true, message: 'Suspicious login report received.' };
  }

  private async issueTokens(userId: string, tenantId: string, profile?: any) {
    const resolvedProfile = profile ?? await this.authorizedProfile(tenantId, userId);
    const state = await this.sessions.touch(userId, resolvedProfile.userSites?.[0]?.companyId ?? resolvedProfile.userSites?.[0]?.site?.companyId ?? null);
    const userSites = resolvedProfile.userSites ?? [];
    const userRoles = resolvedProfile.userRoles ?? [];
    const companyIds = [...new Set(userSites.map((access: any) => access.companyId ?? access.site?.companyId).filter(Boolean))];
    const siteIds = [...new Set(userSites.map((access: any) => access.siteId ?? access.site?.id).filter(Boolean))];
    const roles = [...new Set(userRoles.map((assignment: any) => assignment.role?.key ?? assignment.role?.name).filter(Boolean))];
    const payload = { sub: userId, tenantId, companyIds, siteIds, roles, sessionVersion: state.session_version ?? 1, permissionVersion: state.permission_version ?? 1 };
    return {
      accessToken: await this.jwt.signAsync(payload, {
        secret: this.config.get<string>('auth.accessSecret') ?? 'development-access-secret',
        expiresIn: this.config.get<string>('auth.accessTtl') ?? '15m'
      }),
      refreshToken: await this.jwt.signAsync(payload, {
        secret: this.config.get<string>('auth.refreshSecret') ?? 'development-refresh-secret',
        expiresIn: this.config.get<string>('auth.refreshTtl') ?? '30d'
      }),
      tenantId,
      companyIds,
      siteIds,
      roles,
      sessionVersion: state.session_version ?? 1,
      permissionVersion: state.permission_version ?? 1
    };
  }

  private async authorizedProfile(tenantId: string, userId: string) {
    const profile = await this.users.getProfile(userId);
    if (profile.status !== 'ACTIVE') throw new ForbiddenException('Your account is disabled. Contact your company admin.');
    const roles = profile.userRoles ?? [];
    if (!roles.length) throw new ForbiddenException('No workspace access found. Ask your company admin to invite you.');
    const roleKeys = roles.map((assignment: any) => assignment.role?.key).filter(Boolean);
    const sites = profile.userSites ?? [];
    if (!sites.length && !roleKeys.some((key: string) => ['super_admin', 'platform_admin', 'company_admin'].includes(key))) {
      throw new ForbiddenException('No site access found. Ask your company admin to assign a site.');
    }
    await this.ensureSessionUsable(userId);
    return profile;
  }

  private async ensureSessionUsable(userId: string) {
    const state = await this.sessions.state(userId);
    if (state?.force_logout) throw new UnauthorizedException(state.force_logout_reason ?? 'Your access changed. Please sign in again.');
  }

  private nextRoute(profile: any, requiresPasswordChange: boolean) {
    if (requiresPasswordChange) return '/force-change-password';
    const companyIds = [...new Set((profile.userSites ?? []).map((access: any) => access.companyId ?? access.site?.companyId).filter(Boolean))];
    const siteIds = [...new Set((profile.userSites ?? []).map((access: any) => access.siteId ?? access.site?.id).filter(Boolean))];
    if (companyIds.length > 1) return '/workspace/select';
    if (siteIds.length > 1) return '/site/select';
    return '/dashboard';
  }

  private assertPasswordPolicy(password: string) {
    if (!password || password.length < 12) throw new BadRequestException('Password must be at least 12 characters.');
    if (!/[A-Z]/.test(password)) throw new BadRequestException('Password must include an uppercase letter.');
    if (!/[a-z]/.test(password)) throw new BadRequestException('Password must include a lowercase letter.');
    if (!/[0-9]/.test(password)) throw new BadRequestException('Password must include a number.');
    if (!/[^A-Za-z0-9]/.test(password)) throw new BadRequestException('Password must include a special character.');
  }
}

export type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};
