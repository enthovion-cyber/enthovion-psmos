import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { BillingAuditService } from './billing-audit.service';
import { BillingContextService } from './billing-context.service';
import { BillingProviderFactory } from './billing-provider.factory';
import { BillingPlanService } from './billing-plan.service';
import { CompanyEntitlementService } from './company-entitlement.service';
import { InvoiceService } from './invoice.service';
import { PaymentMethodService } from './payment-method.service';
import { UsageCounterService } from './usage-counter.service';
import { BillingRequestMeta, EntitlementCheckInput } from './billing.types';

@Injectable()
export class BillingSubscriptionService {
  constructor(
    private readonly db: SupabaseService,
    private readonly context: BillingContextService,
    private readonly plans: BillingPlanService,
    private readonly entitlements: CompanyEntitlementService,
    private readonly usage: UsageCounterService,
    private readonly invoices: InvoiceService,
    private readonly paymentMethods: PaymentMethodService,
    private readonly providers: BillingProviderFactory,
    private readonly audit: BillingAuditService
  ) {}

  async overview(user: RequestUser) {
    const ctx = this.context.resolve(user);
    const subscription = await this.ensureSubscription(ctx.companyId, user);
    const [plan, entitlements, usage, invoices, paymentMethods, audit] = await Promise.all([
      subscription?.plan_id ? this.plans.get(subscription.plan_id).catch(() => null) : null,
      this.entitlements.list(ctx.companyId),
      this.usage.recalculate(ctx.companyId),
      this.invoices.list(ctx.companyId),
      this.paymentMethods.list(ctx.companyId),
      this.billingAudit(ctx.companyId)
    ]);
    const limitCards = this.limitCards(entitlements, usage);
    return {
      companyId: ctx.companyId,
      subscription,
      plan,
      accessMode: subscription?.access_mode ?? 'read_only',
      status: subscription?.status ?? 'manual_review',
      entitlements,
      enabledModules: entitlements.filter((item) => item.entitlement_type === 'module' && item.enabled),
      disabledModules: entitlements.filter((item) => item.entitlement_type === 'module' && !item.enabled),
      usage,
      limitCards,
      invoices: invoices.slice(0, 5),
      paymentMethods,
      audit: audit.slice(0, 20),
      actions: this.allowedActions(subscription)
    };
  }

  async subscription(user: RequestUser) {
    return this.ensureSubscription(this.context.resolve(user).companyId, user);
  }

  plan(user: RequestUser) {
    return this.overview(user).then((overview) => overview.plan);
  }

  plansList() {
    return this.plans.list(true);
  }

  entitlementsList(user: RequestUser) {
    return this.entitlements.list(this.context.resolve(user).companyId);
  }

  usageList(user: RequestUser) {
    return this.usage.recalculate(this.context.resolve(user).companyId);
  }

  invoicesList(user: RequestUser) {
    return this.invoices.list(this.context.resolve(user).companyId);
  }

  invoice(user: RequestUser, invoiceId: string) {
    return this.invoices.get(this.context.resolve(user).companyId, invoiceId);
  }

  async invoiceDownload(user: RequestUser, invoiceId: string, meta?: BillingRequestMeta) {
    const ctx = this.context.resolve(user);
    const result = await this.invoices.download(ctx.companyId, invoiceId);
    await this.audit.write({ tenantId: user.tenantId, companyId: ctx.companyId, actorUserId: user.id, action: 'BILLING_INVOICE_DOWNLOADED', targetType: 'BillingInvoice', targetId: invoiceId, after: { invoiceId } as JsonValue, meta });
    return result;
  }

  paymentMethodsList(user: RequestUser) {
    return this.paymentMethods.list(this.context.resolve(user).companyId);
  }

  async checkout(user: RequestUser, input: { planId: string; priceId?: string | null; successUrl?: string; cancelUrl?: string }, meta?: BillingRequestMeta) {
    const ctx = this.context.resolve(user);
    const plan = await this.plans.get(input.planId);
    const price = await this.plans.assertPrice(plan.id, input.priceId);
    await this.ensureCustomer(ctx.companyId, user);
    const idempotencyKey = crypto.randomUUID();
    const session = await this.providers.adapter().createCheckoutSession({
      companyId: ctx.companyId,
      planId: plan.id,
      priceId: price.id,
      successUrl: this.safeReturnUrl(input.successUrl, '/settings/billing/success'),
      cancelUrl: this.safeReturnUrl(input.cancelUrl, '/settings/billing/cancelled'),
      idempotencyKey
    });
    await this.audit.write({ tenantId: user.tenantId, companyId: ctx.companyId, actorUserId: user.id, action: 'BILLING_CHECKOUT_STARTED', targetType: 'SubscriptionPlan', targetId: plan.id, after: { planId: plan.id, priceId: price.id, provider: session.provider } as JsonValue, meta });
    return session;
  }

  async customerPortal(user: RequestUser, meta?: BillingRequestMeta) {
    const ctx = this.context.resolve(user);
    const customer = await this.ensureCustomer(ctx.companyId, user);
    const portal = await this.providers.adapter().createCustomerPortal({ companyId: ctx.companyId, customerId: customer.provider_customer_id, returnUrl: '/settings/billing/payment-method' });
    await this.audit.write({ tenantId: user.tenantId, companyId: ctx.companyId, actorUserId: user.id, action: 'BILLING_PORTAL_OPENED', targetType: 'BillingCustomer', targetId: customer.id, after: { provider: portal.provider } as JsonValue, meta });
    return portal;
  }

  async changePlan(user: RequestUser, input: { planId: string; billingInterval?: string; reason?: string }, meta?: BillingRequestMeta) {
    const ctx = this.context.resolve(user);
    const before = await this.ensureSubscription(ctx.companyId, user);
    const plan = await this.plans.get(input.planId);
    await this.plans.assertPrice(plan.id, null);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const status = plan.plan_type === 'enterprise' ? 'enterprise_contract' : 'active';
    const payload = {
        id: before?.id ?? crypto.randomUUID(),
        company_id: ctx.companyId,
        plan_id: plan.id,
        provider: before?.provider ?? 'provider_agnostic',
        provider_subscription_id: before?.provider_subscription_id ?? null,
        status,
        access_mode: 'full',
        billing_interval: input.billingInterval ?? 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        cancelled_at: null,
        metadata_json: { changedReason: input.reason ?? null },
        created_by: before?.created_by ?? user.id,
        updated_by: user.id,
        updated_at: now.toISOString()
      };
    const subscription = before?.id
      ? await this.db.single<any>(this.db.from('company_subscriptions').update(payload).eq('id', before.id).eq('company_id', ctx.companyId).select().single())
      : await this.db.single<any>(this.db.from('company_subscriptions').insert(payload).select().single());
    await this.entitlements.applyPlan(ctx.companyId, plan.id, user.id);
    await this.audit.write({ tenantId: user.tenantId, companyId: ctx.companyId, actorUserId: user.id, action: before?.plan_id === plan.id ? 'BILLING_PLAN_REFRESHED' : 'BILLING_PLAN_CHANGED', targetType: 'CompanySubscription', targetId: subscription.id, before: before as JsonValue, after: subscription as JsonValue, meta });
    return this.overview(user);
  }

  async cancel(user: RequestUser, input: { reason?: string; cancelAtPeriodEnd?: boolean }, meta?: BillingRequestMeta) {
    const ctx = this.context.resolve(user);
    const before = await this.ensureSubscription(ctx.companyId, user);
    const patch = input.cancelAtPeriodEnd !== false
      ? { status: 'cancel_scheduled', access_mode: 'warning', cancel_at_period_end: true, metadata_json: { cancelReason: input.reason ?? null } }
      : { status: 'cancelled', access_mode: 'read_only', cancel_at_period_end: false, cancelled_at: new Date().toISOString(), metadata_json: { cancelReason: input.reason ?? null } };
    const subscription = await this.db.single<any>(this.db.from('company_subscriptions').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', ctx.companyId).eq('id', before.id).select().single());
    await this.audit.write({ tenantId: user.tenantId, companyId: ctx.companyId, actorUserId: user.id, action: 'BILLING_SUBSCRIPTION_CANCELLED', targetType: 'CompanySubscription', targetId: before.id, before: before as JsonValue, after: subscription as JsonValue, meta });
    return subscription;
  }

  async reactivate(user: RequestUser, meta?: BillingRequestMeta) {
    const ctx = this.context.resolve(user);
    const before = await this.ensureSubscription(ctx.companyId, user);
    const subscription = await this.db.single<any>(this.db.from('company_subscriptions').update({ status: 'active', access_mode: 'full', cancel_at_period_end: false, cancelled_at: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', ctx.companyId).eq('id', before.id).select().single());
    await this.audit.write({ tenantId: user.tenantId, companyId: ctx.companyId, actorUserId: user.id, action: 'BILLING_SUBSCRIPTION_REACTIVATED', targetType: 'CompanySubscription', targetId: before.id, before: before as JsonValue, after: subscription as JsonValue, meta });
    return subscription;
  }

  async setDefaultPaymentMethod(user: RequestUser, paymentMethodId: string, meta?: BillingRequestMeta) {
    const ctx = this.context.resolve(user);
    const method = await this.paymentMethods.setDefault(ctx.companyId, paymentMethodId);
    await this.audit.write({ tenantId: user.tenantId, companyId: ctx.companyId, actorUserId: user.id, action: 'BILLING_PAYMENT_METHOD_DEFAULT_CHANGED', targetType: 'BillingPaymentMethod', targetId: paymentMethodId, after: method as JsonValue, meta });
    return method;
  }

  async checkEntitlement(user: RequestUser, input: EntitlementCheckInput) {
    const ctx = this.context.resolve(user);
    const key = input.entitlementKey ?? (input.moduleKey ? this.entitlements.moduleKey(input.moduleKey) : input.limitKey);
    if (!key) throw new BadRequestException('Entitlement key is required.');
    const subscription = await this.ensureSubscription(ctx.companyId, user);
    if (['locked','read_only'].includes(subscription.access_mode) && !key.includes('view')) {
      return { allowed: false, reason: `Company is in ${subscription.access_mode} billing mode.`, accessMode: subscription.access_mode };
    }
    return this.entitlements.check(ctx.companyId, key, input.requestedValue ?? 1);
  }

  navigationFilter(user: RequestUser) {
    return this.entitlementsList(user).then((items) => ({
      hiddenModules: items.filter((item) => item.entitlement_type === 'module' && !item.enabled).map((item) => item.entitlement_key.replace('module.', '')),
      enabledModules: items.filter((item) => item.entitlement_type === 'module' && item.enabled).map((item) => item.entitlement_key.replace('module.', '')),
      entitlements: items
    }));
  }

  async auditList(user: RequestUser) {
    return this.billingAudit(this.context.resolve(user).companyId);
  }

  private async ensureCustomer(companyId: string, user: RequestUser) {
    const existing = await this.db.single<any>(this.db.from('company_billing_customers').select('*').eq('company_id', companyId).eq('provider', 'provider_agnostic').maybeSingle());
    if (existing) return existing;
    const company = await this.db.single<any>(this.db.from('Company').select('id,name').eq('id', companyId).maybeSingle()).catch(() => null);
    const customer = await this.db.single<any>(this.db.from('company_billing_customers').insert({
      id: crypto.randomUUID(),
      company_id: companyId,
      provider: 'provider_agnostic',
      provider_customer_id: `local_${companyId}`,
      billing_name: company?.name ?? 'Company',
      status: 'active',
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.audit.write({ tenantId: user.tenantId, companyId, actorUserId: user.id, action: 'BILLING_CUSTOMER_CREATED', targetType: 'BillingCustomer', targetId: customer.id, after: customer as JsonValue });
    return customer;
  }

  private async ensureSubscription(companyId: string, user: RequestUser) {
    const existing = await this.db.single<any>(this.db.from('company_subscriptions').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(1).maybeSingle());
    if (existing) return existing;
    const trial = await this.plans.getByCode('trial').catch(() => null);
    if (!trial) throw new NotFoundException('Default trial plan is not configured.');
    const now = new Date();
    const trialDays = Number(trial.trial_days ?? 14);
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const subscription = await this.db.single<any>(this.db.from('company_subscriptions').insert({
      id: crypto.randomUUID(),
      company_id: companyId,
      plan_id: trial.id,
      provider: 'provider_agnostic',
      status: 'trialing',
      access_mode: 'full',
      billing_interval: 'monthly',
      current_period_start: now.toISOString(),
      current_period_end: trialEnd.toISOString(),
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.entitlements.applyPlan(companyId, trial.id, user.id);
    await this.audit.write({ tenantId: user.tenantId, companyId, actorUserId: user.id, action: 'BILLING_TRIAL_STARTED', targetType: 'CompanySubscription', targetId: subscription.id, after: subscription as JsonValue });
    return subscription;
  }

  private billingAudit(companyId: string) {
    return this.db.many<any>(this.db.from('billing_audit_events').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100));
  }

  private limitCards(entitlements: any[], usage: any[]) {
    return entitlements.filter((item) => ['limit','storage','export'].includes(item.entitlement_type)).map((limit) => {
      const usageKey = this.usageKeyForLimit(limit.entitlement_key);
      const counter = usage.find((item) => item.usage_key === usageKey);
      const used = Number(counter?.usage_value ?? 0);
      const allowed = limit.limit_value === null || limit.limit_value === undefined ? null : Number(limit.limit_value);
      const percent = allowed && allowed > 0 ? Math.round((used / allowed) * 100) : 0;
      return {
        key: limit.entitlement_key,
        usageKey,
        used,
        allowed,
        unit: limit.limit_unit ?? counter?.usage_unit ?? 'count',
        percent,
        nearLimit: Boolean(allowed && percent >= 80 && percent < 100),
        exceeded: Boolean(allowed && used >= allowed)
      };
    });
  }

  private usageKeyForLimit(key: string) {
    if (key === 'limit.seats') return 'seats.active';
    if (key === 'limit.sites') return 'sites.active';
    if (key === 'limit.storage') return 'storage.used_gb';
    if (key === 'limit.exports.monthly') return 'exports.monthly';
    return key.replace('limit.', '');
  }

  private allowedActions(subscription: any) {
    return {
      canCheckout: !subscription || ['trialing','incomplete','past_due','unpaid'].includes(subscription.status),
      canChangePlan: !subscription || !['locked'].includes(subscription.access_mode),
      canCancel: subscription && !['cancelled','expired'].includes(subscription.status),
      canReactivate: subscription && ['cancel_scheduled','cancelled','expired','past_due','unpaid'].includes(subscription.status)
    };
  }

  private safeReturnUrl(url: string | undefined, fallback: string) {
    if (!url) return fallback;
    if (url.startsWith('/') && !url.startsWith('//')) return url;
    throw new ForbiddenException('External billing redirects are not allowed.');
  }
}
