import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { AuthSecurityEventService } from './auth-security-event.service';
import { AuthSessionService } from './auth-session.service';
import { AuthPostCallbackDto, CompleteWorkspaceDto, SignupEmailDto, SignupStatusQueryDto, StartCheckoutDto, StartTrialDto } from './dto/signup.dto';

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

type SignupSession = {
  id: string;
  email: string;
  provider: string;
  provider_user_id?: string | null;
  status: string;
  current_step: string;
  user_id?: string | null;
  tenant_id?: string | null;
  company_id?: string | null;
  site_id?: string | null;
  email_verified_at?: string | null;
  metadata_json?: Record<string, any> | null;
};

const ADMIN_PERMISSION_KEYS = [
  'dashboard.view',
  'navigation.view',
  'company.view',
  'company.manage',
  'site.view',
  'site.manage',
  'settings.view',
  'settings.manage',
  'users.view',
  'users.create',
  'users.edit',
  'users.invite',
  'users.manage',
  'roles.view',
  'roles.manage',
  'roles.assign',
  'permissions.view',
  'permissions.edit',
  'billing.view',
  'billing.plan.view',
  'billing.checkout',
  'incidents.view',
  'incidents.register.view',
  'incidents.summary.view',
  'incidents.create',
  'ptw.dashboard.view',
  'moc.dashboard.view',
  'pssr.dashboard.view',
  'hazop.dashboard.view',
  'hazop.view',
  'lopa.dashboard.view',
  'lopa.view',
  'documents.view',
  'equipment.view',
  'actions.view',
  'notifications.view',
  'search.use'
];

@Injectable()
export class SignupService {
  constructor(
    private readonly db: SupabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly sessions: AuthSessionService,
    private readonly securityEvents: AuthSecurityEventService,
    private readonly audit: AuditService
  ) {}

  async email(dto: SignupEmailDto, meta?: RequestMeta) {
    const email = this.normalizeEmail(dto.email);
    this.assertPasswordPolicy(dto.password, dto.confirmPassword);
    if (dto.termsAccepted === false) throw new BadRequestException('You must accept the terms to create a workspace.');
    const existing = await this.findUserByEmail(email);
    if (existing?.status === 'ACTIVE') throw new BadRequestException('An active account already exists for this email. Sign in instead.');
    const appPasswordHash = await hash(dto.password, 10);
    const session = await this.upsertSession(email, 'email', {
      status: 'verification_pending',
      current_step: 'verify_email',
      metadata: {
        appPasswordHash,
        emailRedirectTo: dto.emailRedirectTo ?? null,
        termsAccepted: dto.termsAccepted ?? true,
        passwordPolicyVersion: 'default-v1',
        intent: dto.intent ?? null,
        planCode: dto.planCode ?? null
      },
      ...(dto.supabaseUserId ? { providerUserId: dto.supabaseUserId } : {})
    });
    await this.recordSignupEvent(session.id, email, 'SIGNUP_EMAIL_STARTED', 'email', true, meta);
    await this.securityEvents.record({ email, provider: 'email', eventType: 'SIGNUP_EMAIL_STARTED', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
    return {
      success: true,
      status: 'verification_pending',
      currentStep: 'verify_email',
      sessionId: session.id,
      email,
      next: `/signup/verify-email?email=${encodeURIComponent(email)}`
    };
  }

  async resendVerification(emailInput: string, meta?: RequestMeta) {
    const email = this.normalizeEmail(emailInput);
    const session = await this.findSession({ email });
    if (!session) throw new NotFoundException('No pending signup was found for this email.');
    const updated = await this.db.single<SignupSession>(
      this.db.from('signup_onboarding_sessions')
        .update({ last_resend_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', session.id)
        .select()
        .single()
    );
    await this.recordSignupEvent(session.id, email, 'SIGNUP_VERIFICATION_RESENT', session.provider, true, meta);
    return { success: true, message: 'Verification email requested.', sessionId: updated?.id ?? session.id };
  }

  async status(query: SignupStatusQueryDto) {
    const session = await this.findSession(query);
    if (!session) return { found: false, status: 'not_started', currentStep: 'signup' };
    return {
      found: true,
      sessionId: session.id,
      email: session.email,
      provider: session.provider,
      status: session.status,
      currentStep: session.current_step,
      next: this.nextForSession(session)
    };
  }

  async nextStep(query: SignupStatusQueryDto) {
    const status = await this.status(query);
    return { ...status, next: status.found ? this.nextForStatus(status.status, status.currentStep, status.sessionId, status.email) : '/signup' };
  }

  async postCallback(dto: AuthPostCallbackDto, meta?: RequestMeta) {
    const email = this.normalizeEmail(dto.email);
    const provider = dto.provider ?? 'google';
    const existing = await this.findUserByEmail(email);
    if (existing) {
      if (existing.status !== 'ACTIVE') {
        await this.securityEvents.record({ tenantId: existing.tenantId, userId: existing.id, email, provider, eventType: 'DEACTIVATED_USER_LOGIN_BLOCKED', success: false, failureReason: 'Account disabled', ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
        return { status: 'blocked', next: '/account-disabled', reason: 'Account disabled' };
      }
      const tokens = await this.issueTokens(existing.id, existing.tenantId);
      await this.securityEvents.record({ tenantId: existing.tenantId, userId: existing.id, email, provider, eventType: 'OAUTH_LOGIN_SUCCESS', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
      return { status: 'signed_in', next: this.nextRoute(tokens.companyIds, tokens.siteIds), ...tokens };
    }
    const session = await this.upsertSession(email, provider, {
      status: 'email_verified',
      current_step: 'complete_workspace',
      metadata: {
        displayName: dto.displayName ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        flow: dto.flow ?? 'signup',
        emailVerified: dto.emailVerified ?? provider === 'google',
        intent: dto.intent ?? null,
        planCode: dto.planCode ?? null
      },
      ...(dto.providerUserId ? { providerUserId: dto.providerUserId } : {})
    });
    await this.recordSignupEvent(session.id, email, 'SIGNUP_OAUTH_CALLBACK', provider, true, meta);
    return {
      status: 'onboarding_required',
      sessionId: session.id,
      email,
      provider,
      next: this.withMarketingIntent(`/signup/complete?sessionId=${encodeURIComponent(session.id)}`, session.metadata_json)
    };
  }

  async completeWorkspace(dto: CompleteWorkspaceDto, meta?: RequestMeta) {
    const email = this.normalizeEmail(dto.email);
    const session = await this.findSession({ email, ...(dto.sessionId ? { sessionId: dto.sessionId } : {}) });
    if (!session) throw new NotFoundException('Signup session was not found. Start signup again.');
    if (session.user_id && session.company_id && session.tenant_id) {
      const tokens = await this.issueTokens(session.user_id, session.tenant_id);
      return { status: 'workspace_complete', sessionId: session.id, next: this.withMarketingIntent('/signup/choose-plan', session.metadata_json), ...tokens };
    }
    const existing = await this.findUserByEmail(email);
    if (existing) throw new BadRequestException('An account already exists for this email. Sign in instead.');

    const slug = this.slug(dto.workspaceSlug);
    await this.assertTenantSlugAvailable(slug);
    const tenantId = `tenant_${slug}_${Date.now().toString(36)}`;
    const companyId = `company_${slug}_${crypto.randomUUID().slice(0, 8)}`;
    const siteId = dto.primarySiteName ? `site_${slug}_${crypto.randomUUID().slice(0, 8)}` : null;
    const userId = `user_${crypto.randomUUID()}`;
    const passwordHash = String(session.metadata_json?.appPasswordHash ?? await hash(crypto.randomUUID(), 10));
    const now = new Date().toISOString();

    await this.db.single(this.db.from('Tenant').insert({ id: tenantId, name: dto.workspaceName, slug, status: 'ACTIVE', updatedAt: now }).select('id').single());
    await this.db.single(this.db.from('Company').insert({
      id: companyId,
      tenantId,
      name: dto.workspaceName,
      legalName: dto.workspaceName,
      code: slug.toUpperCase().slice(0, 12),
      status: 'ACTIVE',
      updatedAt: now
    }).select('id').single());
    if (siteId && dto.primarySiteName) {
      await this.db.single(this.db.from('Site').insert({
        id: siteId,
        tenantId,
        companyId,
        name: dto.primarySiteName,
        code: this.siteCode(dto.primarySiteName),
        timezone: dto.timezone ?? 'UTC',
        country: dto.country ?? null,
        status: 'ACTIVE',
        updatedAt: now
      }).select('id').single()).catch(() => null);
    }
    await this.db.single(this.db.from('User').insert({
      id: userId,
      tenantId,
      email,
      passwordHash,
      displayName: dto.fullName,
      title: dto.title ?? null,
      department: null,
      status: 'ACTIVE',
      lastLoginAt: null,
      updatedAt: now
    }).select('id').single());
    await this.db.single(this.db.from('UserProfile').insert({
      userId,
      avatarUrl: dto.avatarUrl ?? session.metadata_json?.avatarUrl ?? null,
      phone: dto.phone ?? null,
      timezone: dto.timezone ?? null,
      metadata: {
        signupProvider: session.provider,
        industry: dto.industry ?? null,
        companySize: dto.companySize ?? null,
        country: dto.country ?? null,
        providerUserId: dto.providerUserId ?? session.provider_user_id ?? null
      },
      updatedAt: now
    }).select('userId').single()).catch(() => null);
    await this.safeInsertMembership(companyId, userId);
    const roleId = await this.ensureCompanyAdminRole(tenantId, companyId);
    await this.ensureAdminPermissions(tenantId, roleId);
    await this.assignCompanyAdmin(userId, roleId, companyId, siteId);
    const completed = await this.db.single<SignupSession>(this.db.from('signup_onboarding_sessions').update({
      user_id: userId,
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      status: 'workspace_complete',
      current_step: 'choose_plan',
      metadata_json: { ...(session.metadata_json ?? {}), intent: dto.intent ?? session.metadata_json?.intent ?? null, planCode: dto.planCode ?? session.metadata_json?.planCode ?? null },
      email_verified_at: session.email_verified_at ?? now,
      updated_at: now
    }).eq('id', session.id).select().single());
    await this.audit.write({
      tenantId,
      actorId: userId,
      action: 'SIGNUP_WORKSPACE_COMPLETED',
      entityType: 'Company',
      entityId: companyId,
      after: { companyId, siteId, email: '[redacted-email]', role: 'company_admin' } as JsonValue
    }).catch(() => null);
    await this.recordSignupEvent(session.id, email, 'SIGNUP_WORKSPACE_COMPLETED', session.provider, true, meta, { companyId, siteId });
    await this.securityEvents.record({ tenantId, userId, companyId, siteId, email, provider: session.provider, eventType: 'SIGNUP_WORKSPACE_COMPLETED', success: true, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent });
    const tokens = await this.issueTokens(userId, tenantId);
    return { status: completed?.status ?? 'workspace_complete', sessionId: session.id, next: this.withMarketingIntent('/signup/choose-plan', completed?.metadata_json ?? session.metadata_json), ...tokens };
  }

  async plans() {
    const plans = await this.db.many<any>(
      this.db.from('subscription_plans')
        .select('id,name,code,description,plan_type,status,public_visible,sort_order,trial_days,default_currency,prices:subscription_plan_prices(id,currency,billing_interval,amount_cents,seat_pricing_type,status)')
        .eq('public_visible', true)
        .eq('status', 'active')
        .order('sort_order')
    ).catch(() => []);
    return { plans, billingConfigured: plans.length > 0 };
  }

  async startTrial(dto: StartTrialDto, meta?: RequestMeta) {
    const session = await this.findSession(dto.sessionId ? { sessionId: dto.sessionId } : {});
    const companyId = dto.companyId ?? session?.company_id;
    if (!companyId) throw new BadRequestException('A workspace must be completed before starting a trial.');
    const plan = await this.db.single<any>(this.db.from('subscription_plans').select('*').eq('code', 'trial').eq('status', 'active').maybeSingle()).catch(() => null);
    const now = new Date();
    const trialDays = Number(plan?.trial_days ?? 14);
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    await this.db.single(this.db.from('company_subscriptions').insert({
      company_id: companyId,
      plan_id: plan?.id ?? null,
      provider: 'provider_agnostic',
      status: 'trialing',
      access_mode: 'full',
      billing_interval: 'monthly',
      trial_start: now.toISOString(),
      trial_end: trialEnd,
      current_period_start: now.toISOString(),
      current_period_end: trialEnd,
      metadata_json: { source: 'signup' },
      created_by: session?.user_id ?? null,
      updated_by: session?.user_id ?? null
    }).select('id').single()).catch(async () => this.db.single(this.db.from('company_subscriptions').update({
      status: 'trialing',
      access_mode: 'full',
      trial_end: trialEnd,
      updated_at: new Date().toISOString()
    }).eq('company_id', companyId).select('id').single()));
    if (session) {
      await this.db.single(this.db.from('signup_onboarding_sessions').update({ status: 'trialing', current_step: 'success', updated_at: new Date().toISOString() }).eq('id', session.id).select('id').single()).catch(() => null);
      await this.recordSignupEvent(session.id, session.email, 'SIGNUP_TRIAL_STARTED', session.provider, true, meta, { companyId });
    }
    return { success: true, status: 'trialing', next: '/signup/success', trialEnd };
  }

  async startCheckout(dto: StartCheckoutDto, meta?: RequestMeta) {
    const session = await this.findSession(dto.sessionId ? { sessionId: dto.sessionId } : {});
    const plan = await this.db.single<any>(this.db.from('subscription_plans').select('id,code,name').eq('code', dto.planCode).eq('status', 'active').maybeSingle()).catch(() => null);
    if (!plan) throw new NotFoundException('Selected plan is not available.');
    if (session) await this.recordSignupEvent(session.id, session.email, 'SIGNUP_CHECKOUT_REQUESTED', session.provider, true, meta, { planCode: dto.planCode });
    return {
      success: false,
      status: 'checkout_provider_unconfigured',
      message: 'Payment provider checkout is not configured yet. Start a trial or contact sales.',
      plan
    };
  }

  async bootstrap(userId: string, tenantId: string) {
    const user = await this.db.single<any>(this.db.from('User').select('id,tenantId,email,displayName,status,title,department').eq('tenantId', tenantId).eq('id', userId).single());
    const effective = await this.buildTokenProfile(userId, tenantId);
    return { user, ...effective, onboarding: { complete: true } };
  }

  async onboardingStatus(userId: string) {
    const session = await this.db.single<SignupSession>(this.db.from('signup_onboarding_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
    return { complete: !session || ['trialing', 'completed'].includes(session.status), session };
  }

  private async findUserByEmail(email: string) {
    return this.db.single<any>(this.db.from('User').select('id,tenantId,email,status,passwordHash,displayName').ilike('email', email).maybeSingle()).catch(() => null);
  }

  private async findSession(input: SignupStatusQueryDto) {
    if (input.sessionId) return this.db.single<SignupSession>(this.db.from('signup_onboarding_sessions').select('*').eq('id', input.sessionId).maybeSingle()).catch(() => null);
    if (input.email) return this.db.single<SignupSession>(this.db.from('signup_onboarding_sessions').select('*').ilike('email', this.normalizeEmail(input.email)).order('created_at', { ascending: false }).limit(1).maybeSingle()).catch(() => null);
    return null;
  }

  private async upsertSession(email: string, provider: string, input: { status: string; current_step: string; providerUserId?: string; metadata?: Record<string, any> }) {
    const existing = await this.findSession({ email });
    const metadata = { ...(existing?.metadata_json ?? {}), ...(input.metadata ?? {}) };
    const row = {
      email,
      provider,
      provider_user_id: input.providerUserId ?? existing?.provider_user_id ?? null,
      status: input.status,
      current_step: input.current_step,
      email_verified_at: input.status === 'email_verified' ? new Date().toISOString() : existing?.email_verified_at ?? null,
      metadata_json: metadata,
      updated_at: new Date().toISOString()
    };
    if (existing) {
      return this.required(await this.db.single<SignupSession>(this.db.from('signup_onboarding_sessions').update(row).eq('id', existing.id).select().single()), 'Unable to update signup session.');
    }
    return this.required(await this.db.single<SignupSession>(this.db.from('signup_onboarding_sessions').insert({ id: crypto.randomUUID(), ...row }).select().single()), 'Unable to create signup session.');
  }

  private async assertTenantSlugAvailable(slug: string) {
    const existingTenant = await this.db.single<any>(this.db.from('Tenant').select('id').eq('slug', slug).maybeSingle()).catch(() => null);
    if (existingTenant) throw new BadRequestException('Workspace slug is already taken.');
  }

  private async ensureCompanyAdminRole(tenantId: string, companyId: string) {
    const existing = await this.db.single<any>(this.db.from('Role').select('id').eq('tenantId', tenantId).eq('key', 'company_admin').maybeSingle()).catch(() => null);
    if (existing?.id) return String(existing.id);
    const role = await this.db.single<any>(this.db.from('Role').insert({
      id: crypto.randomUUID(),
      tenantId,
      key: 'company_admin',
      name: 'Company Admin',
      scopeType: 'COMPANY',
      companyId,
      systemRole: false,
      updatedAt: new Date().toISOString()
    }).select('id').single());
    return String(role?.id);
  }

  private async ensureAdminPermissions(tenantId: string, roleId: string) {
    for (const key of ADMIN_PERMISSION_KEYS) {
      const existing = await this.db.single<any>(this.db.from('Permission').select('id').eq('tenantId', tenantId).eq('key', key).maybeSingle()).catch(() => null);
      const permissionId = existing?.id ?? crypto.randomUUID();
      if (!existing) {
        await this.db.single(this.db.from('Permission').insert({
          id: permissionId,
          tenantId,
          key,
          moduleKey: key.split('.')[0] ?? 'foundation',
          label: this.permissionLabel(key)
        }).select('id').single()).catch(() => null);
      }
      const link = await this.db.single<any>(this.db.from('RolePermission').select('roleId,permissionId').eq('roleId', roleId).eq('permissionId', permissionId).maybeSingle()).catch(() => null);
      if (!link) {
        await this.db.single(this.db.from('RolePermission').insert({ roleId, permissionId }).select('roleId').single()).catch(() => null);
      }
    }
  }

  private async assignCompanyAdmin(userId: string, roleId: string, companyId: string, siteId: string | null) {
    await this.db.single(this.db.from('UserRole').insert({
      id: crypto.randomUUID(),
      userId,
      roleId,
      scopeType: 'COMPANY',
      companyId,
      siteId: null
    }).select('id').single()).catch(() => null);
    if (siteId) {
      await this.db.single(this.db.from('UserSite').insert({
        userId,
        siteId,
        companyId,
        createdAt: new Date().toISOString()
      }).select('userId').single()).catch(() => null);
    }
  }

  private async safeInsertMembership(companyId: string, userId: string) {
    await this.db.single(this.db.from('UserCompanyMembership').insert({
      id: crypto.randomUUID(),
      companyId,
      userId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).select('id').single()).catch(() => null);
  }

  private async buildTokenProfile(userId: string, tenantId: string) {
    const [roles, userSites] = await Promise.all([
      this.db.many<any>(this.db.from('UserRole').select('roleId,companyId,siteId,role:Role(id,key,name,scopeType,companyId,siteId)').eq('userId', userId)).catch(() => []),
      this.db.many<any>(this.db.from('UserSite').select('companyId,siteId,site:Site(id,name,companyId)').eq('userId', userId)).catch(() => [])
    ]);
    const companyIds = [...new Set([...roles.map((role) => role.companyId), ...userSites.map((site) => site.companyId ?? site.site?.companyId)].filter(Boolean))];
    const siteIds = [...new Set([...roles.map((role) => role.siteId), ...userSites.map((site) => site.siteId ?? site.site?.id)].filter(Boolean))];
    const roleKeys = [...new Set(roles.map((assignment) => assignment.role?.key ?? assignment.role?.name).filter(Boolean))];
    const permissions = await this.permissionsForRoles(tenantId, roles.map((role) => role.roleId).filter(Boolean));
    return { roles: roleKeys, companyIds, siteIds, permissions, userRoles: roles, userSites };
  }

  private async permissionsForRoles(tenantId: string, roleIds: string[]) {
    if (!roleIds.length) return [];
    const grants = await this.db.many<any>(this.db.from('RolePermission').select('permissionId').in('roleId', roleIds)).catch(() => []);
    const permissionIds = [...new Set(grants.map((grant) => grant.permissionId).filter(Boolean))];
    if (!permissionIds.length) return [];
    const permissions = await this.db.many<any>(this.db.from('Permission').select('key').eq('tenantId', tenantId).in('id', permissionIds)).catch(() => []);
    return [...new Set(permissions.map((permission) => permission.key).filter(Boolean))];
  }

  private async issueTokens(userId: string, tenantId: string) {
    const state = await this.sessions.touch(userId, null);
    const profile = await this.buildTokenProfile(userId, tenantId);
    const payload = {
      sub: userId,
      tenantId,
      companyIds: profile.companyIds,
      siteIds: profile.siteIds,
      roles: profile.roles,
      sessionVersion: state.session_version ?? 1,
      permissionVersion: state.permission_version ?? 1
    };
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
      companyIds: profile.companyIds,
      siteIds: profile.siteIds,
      roles: profile.roles,
      permissions: profile.permissions,
      sessionVersion: state.session_version ?? 1,
      permissionVersion: state.permission_version ?? 1
    };
  }

  private nextRoute(companyIds: string[], siteIds: string[]) {
    if (companyIds.length > 1) return '/workspace/select';
    if (siteIds.length > 1) return '/site/select';
    return '/dashboard';
  }

  private nextForSession(session: SignupSession) {
    return this.nextForStatus(session.status, session.current_step, session.id, session.email, session.metadata_json);
  }

  private nextForStatus(status: string, currentStep: string, sessionId?: string, email?: string, metadata?: Record<string, any> | null) {
    if (status === 'verification_pending') return `/signup/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`;
    if (currentStep === 'choose_plan') return this.withMarketingIntent(`/signup/choose-plan${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`, metadata);
    if (currentStep === 'success' || status === 'completed' || status === 'trialing') return '/signup/success';
    return this.withMarketingIntent(`/signup/complete${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`, metadata);
  }

  private withMarketingIntent(path: string, metadata?: Record<string, any> | null) {
    const intent = typeof metadata?.intent === 'string' ? metadata.intent : null;
    const planCode = typeof metadata?.planCode === 'string' ? metadata.planCode : null;
    if (!intent && !planCode) return path;
    const params = new URLSearchParams();
    if (intent) params.set('intent', intent);
    if (planCode) params.set('plan', planCode);
    return `${path}${path.includes('?') ? '&' : '?'}${params.toString()}`;
  }

  private async recordSignupEvent(sessionId: string, email: string, eventType: string, provider: string, success: boolean, meta?: RequestMeta, metadata?: Record<string, any>) {
    await this.db.single(this.db.from('signup_security_events').insert({
      id: crypto.randomUUID(),
      session_id: sessionId,
      email,
      event_type: eventType,
      provider,
      success,
      ip_address: meta?.ipAddress ?? null,
      user_agent: meta?.userAgent ?? null,
      metadata_json: metadata ?? {}
    }).select('id').single()).catch(() => null);
  }

  private assertPasswordPolicy(password: string, confirmPassword?: string) {
    if (confirmPassword !== undefined && password !== confirmPassword) throw new BadRequestException('Passwords do not match.');
    if (!password || password.length < 12) throw new BadRequestException('Password must be at least 12 characters.');
    if (!/[A-Z]/.test(password)) throw new BadRequestException('Password must include an uppercase letter.');
    if (!/[a-z]/.test(password)) throw new BadRequestException('Password must include a lowercase letter.');
    if (!/[0-9]/.test(password)) throw new BadRequestException('Password must include a number.');
    if (!/[^A-Za-z0-9]/.test(password)) throw new BadRequestException('Password must include a special character.');
  }

  private normalizeEmail(email: string) {
    return email.toLowerCase().trim();
  }

  private slug(input: string) {
    return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  }

  private siteCode(input: string) {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'SITE';
  }

  private permissionLabel(key: string) {
    return key.split('.').map((part) => part.replace(/_/g, ' ')).join(' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private required<T>(value: T | null, message: string): T {
    if (!value) throw new BadRequestException(message);
    return value;
  }
}
