import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthSecurityEventService } from './auth-security-event.service';
import { CompanyDomainAuthService } from './company-domain-auth.service';

@Injectable()
export class AuthGoogleService {
  constructor(
    private readonly users: UsersService,
    private readonly domains: CompanyDomainAuthService,
    private readonly securityEvents: AuthSecurityEventService
  ) {}

  start() {
    return { provider: 'google', url: '/auth/google/callback', message: 'Configure Google OAuth provider URL in deployment settings.' };
  }

  async complete(input: { email: string; providerUserId?: string; displayName?: string; avatarUrl?: string }, meta?: { ipAddress?: string; userAgent?: string }) {
    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email).catch(() => null);
    if (existing) {
      await this.securityEvents.record({ tenantId: existing.tenantId, userId: existing.id, email, provider: 'google', eventType: 'GOOGLE_LOGIN_SUCCESS', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
      return { mode: 'existing_user', email, userId: existing.id };
    }
    const domainResult = await this.domains.evaluate(email);
    if (!domainResult.allowed) {
      await this.securityEvents.record({ email, provider: 'google', eventType: 'GOOGLE_LOGIN_BLOCKED', success: false, failureReason: domainResult.reason, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
      throw new BadRequestException(domainResult.reason);
    }
    if (!domainResult.allowAutoJoin) {
      await this.securityEvents.record({ email, provider: 'google', eventType: 'GOOGLE_LOGIN_BLOCKED_NO_INVITATION', success: false, failureReason: 'Invitation required', ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
      throw new BadRequestException('No workspace found for this email. Ask your company admin to invite you.');
    }
    return { mode: 'domain_allowed_invite_required', email, company: domainResult.company };
  }
}
