import { Body, Controller, Get, Headers, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionKeys } from '../permissions/constants/permission-keys';
import { BillingPlanService } from './billing-plan.service';
import { BillingSubscriptionService } from './billing-subscription.service';
import { BillingWebhookService } from './billing-webhook.service';
import { UsageCounterService } from './usage-counter.service';
import { SupabaseService } from '../database/supabase.service';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class BillingController {
  constructor(
    private readonly billing: BillingSubscriptionService,
    private readonly plans: BillingPlanService,
    private readonly usage: UsageCounterService,
    private readonly webhooks: BillingWebhookService
  ) {}

  @Get('billing/overview')
  @Permissions(PermissionKeys.BillingView)
  overview(@CurrentUser() user: RequestUser) {
    return this.billing.overview(user);
  }

  @Get('billing/subscription')
  @Permissions(PermissionKeys.BillingView)
  subscription(@CurrentUser() user: RequestUser) {
    return this.billing.subscription(user);
  }

  @Get('billing/plan')
  @Permissions(PermissionKeys.BillingPlanView)
  plan(@CurrentUser() user: RequestUser) {
    return this.billing.plan(user);
  }

  @Get('billing/plans')
  @Permissions(PermissionKeys.BillingPlanView)
  plansList() {
    return this.plans.list(true);
  }

  @Get('billing/entitlements')
  @Permissions(PermissionKeys.EntitlementsView)
  entitlements(@CurrentUser() user: RequestUser) {
    return this.billing.entitlementsList(user);
  }

  @Get('billing/usage')
  @Permissions(PermissionKeys.BillingUsageView)
  usageList(@CurrentUser() user: RequestUser) {
    return this.billing.usageList(user);
  }

  @Get('billing/invoices')
  @Permissions(PermissionKeys.BillingInvoiceView)
  invoices(@CurrentUser() user: RequestUser) {
    return this.billing.invoicesList(user);
  }

  @Get('billing/invoices/:invoiceId')
  @Permissions(PermissionKeys.BillingInvoiceView)
  invoice(@CurrentUser() user: RequestUser, @Param('invoiceId') invoiceId: string) {
    return this.billing.invoice(user, invoiceId);
  }

  @Get('billing/invoices/:invoiceId/download')
  @Permissions(PermissionKeys.BillingInvoiceDownload)
  invoiceDownload(@CurrentUser() user: RequestUser, @Param('invoiceId') invoiceId: string, @Req() req: RequestLike) {
    return this.billing.invoiceDownload(user, invoiceId, requestMeta(req));
  }

  @Get('billing/payment-methods')
  @Permissions(PermissionKeys.BillingPaymentMethodView)
  paymentMethods(@CurrentUser() user: RequestUser) {
    return this.billing.paymentMethodsList(user);
  }

  @Post('billing/checkout')
  @Permissions(PermissionKeys.BillingCheckout)
  checkout(@CurrentUser() user: RequestUser, @Body() body: { planId: string; priceId?: string; successUrl?: string; cancelUrl?: string }, @Req() req: RequestLike) {
    return this.billing.checkout(user, body, requestMeta(req));
  }

  @Post('billing/customer-portal')
  @Permissions(PermissionKeys.BillingPaymentMethodManage)
  customerPortal(@CurrentUser() user: RequestUser, @Req() req: RequestLike) {
    return this.billing.customerPortal(user, requestMeta(req));
  }

  @Post('billing/change-plan')
  @Permissions(PermissionKeys.BillingPlanChange)
  changePlan(@CurrentUser() user: RequestUser, @Body() body: { planId: string; billingInterval?: string; reason?: string }, @Req() req: RequestLike) {
    return this.billing.changePlan(user, body, requestMeta(req));
  }

  @Post('billing/cancel')
  @Permissions(PermissionKeys.BillingCancel)
  cancel(@CurrentUser() user: RequestUser, @Body() body: { reason?: string; cancelAtPeriodEnd?: boolean }, @Req() req: RequestLike) {
    return this.billing.cancel(user, body, requestMeta(req));
  }

  @Post('billing/reactivate')
  @Permissions(PermissionKeys.BillingReactivate)
  reactivate(@CurrentUser() user: RequestUser, @Req() req: RequestLike) {
    return this.billing.reactivate(user, requestMeta(req));
  }

  @Post('billing/payment-methods/default')
  @Permissions(PermissionKeys.BillingPaymentMethodManage)
  setDefaultPaymentMethod(@CurrentUser() user: RequestUser, @Body() body: { paymentMethodId: string }, @Req() req: RequestLike) {
    return this.billing.setDefaultPaymentMethod(user, body.paymentMethodId, requestMeta(req));
  }

  @Get('billing/audit')
  @Permissions(PermissionKeys.BillingAuditView)
  audit(@CurrentUser() user: RequestUser) {
    return this.billing.auditList(user);
  }

  @Get('entitlements/company')
  @Permissions(PermissionKeys.EntitlementsView)
  companyEntitlements(@CurrentUser() user: RequestUser) {
    return this.billing.entitlementsList(user);
  }

  @Get('entitlements/modules')
  @Permissions(PermissionKeys.EntitlementsView)
  modules(@CurrentUser() user: RequestUser) {
    return this.billing.navigationFilter(user);
  }

  @Post('entitlements/check')
  @Permissions(PermissionKeys.EntitlementsView)
  check(@CurrentUser() user: RequestUser, @Body() body: { entitlementKey?: string; moduleKey?: string; limitKey?: string; requestedValue?: number }) {
    return this.billing.checkEntitlement(user, body);
  }

  @Post('entitlements/check-module')
  @Permissions(PermissionKeys.EntitlementsView)
  checkModule(@CurrentUser() user: RequestUser, @Body() body: { moduleKey: string }) {
    return this.billing.checkEntitlement(user, { moduleKey: body.moduleKey });
  }

  @Post('entitlements/check-limit')
  @Permissions(PermissionKeys.EntitlementsView)
  checkLimit(@CurrentUser() user: RequestUser, @Body() body: { limitKey: string; requestedValue?: number }) {
    return this.billing.checkEntitlement(user, body);
  }

  @Get('entitlements/navigation-filter')
  @Permissions(PermissionKeys.EntitlementsView)
  navigationFilter(@CurrentUser() user: RequestUser) {
    return this.billing.navigationFilter(user);
  }

  @Get('usage/company')
  @Permissions(PermissionKeys.BillingUsageView)
  companyUsage(@CurrentUser() user: RequestUser) {
    return this.billing.usageList(user);
  }

  @Get('usage/sites')
  @Permissions(PermissionKeys.BillingUsageView)
  siteUsage(@CurrentUser() user: RequestUser) {
    return this.billing.usageList(user).then((rows) => rows.filter((row: any) => row.site_id));
  }

  @Post('usage/recalculate')
  @Permissions(PermissionKeys.BillingUsageView)
  recalculateUsage(@CurrentUser() user: RequestUser) {
    return this.billing.usageList(user);
  }

  @Get('usage/export')
  @Permissions(PermissionKeys.BillingUsageExport)
  exportUsage(@CurrentUser() user: RequestUser) {
    return this.billing.usageList(user).then((rows) => ({ rows, format: 'json' }));
  }

  @Public()
  @Post('webhooks/billing/provider')
  webhook(@Body() body: Record<string, unknown>, @Headers('x-billing-signature') signature?: string) {
    return this.webhooks.process(body, signature);
  }
}

@ApiTags('platform billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('platform/billing')
export class PlatformBillingController {
  constructor(
    private readonly plans: BillingPlanService,
    private readonly webhooks: BillingWebhookService,
    private readonly db: SupabaseService
  ) {}

  @Get('plans')
  @Permissions(PermissionKeys.PlatformPlansView)
  plansList() {
    return this.plans.list(false);
  }

  @Post('plans')
  @Permissions(PermissionKeys.PlatformPlansManage)
  createPlan(@Body() body: Record<string, unknown>) {
    return this.db.single(this.db.from('subscription_plans').insert({ id: crypto.randomUUID(), ...body }).select().single());
  }

  @Patch('plans/:planId')
  @Permissions(PermissionKeys.PlatformPlansManage)
  updatePlan(@Param('planId') planId: string, @Body() body: Record<string, unknown>) {
    return this.db.single(this.db.from('subscription_plans').update({ ...body, updated_at: new Date().toISOString() }).eq('id', planId).select().single());
  }

  @Post('plans/:planId/prices')
  @Permissions(PermissionKeys.PlatformPlansManage)
  createPrice(@Param('planId') planId: string, @Body() body: Record<string, unknown>) {
    return this.db.single(this.db.from('subscription_plan_prices').insert({ id: crypto.randomUUID(), plan_id: planId, ...body }).select().single());
  }

  @Post('plans/:planId/entitlements')
  @Permissions(PermissionKeys.PlatformPlansManage)
  createEntitlement(@Param('planId') planId: string, @Body() body: Record<string, unknown>) {
    return this.db.single(this.db.from('subscription_plan_entitlements').insert({ id: crypto.randomUUID(), plan_id: planId, ...body }).select().single());
  }

  @Get('companies')
  @Permissions(PermissionKeys.PlatformBillingView)
  companies() {
    return this.db.many(this.db.from('company_subscriptions').select('*, company:Company(*)').order('updated_at', { ascending: false }));
  }

  @Get('companies/:companyId')
  @Permissions(PermissionKeys.PlatformBillingView)
  company(@Param('companyId') companyId: string) {
    return this.db.single(this.db.from('company_subscriptions').select('*, company:Company(*), plan:subscription_plans(*)').eq('company_id', companyId).maybeSingle());
  }

  @Patch('companies/:companyId/override')
  @Permissions(PermissionKeys.PlatformBillingManage)
  override(@Param('companyId') companyId: string, @Body() body: Record<string, unknown>) {
    return this.db.single(this.db.from('billing_admin_overrides').insert({ id: crypto.randomUUID(), company_id: companyId, ...body }).select().single());
  }

  @Get('webhook-events')
  @Permissions(PermissionKeys.PlatformWebhooksView)
  webhookEvents() {
    return this.webhooks.list();
  }

  @Post('webhook-events/:eventId/replay')
  @Permissions(PermissionKeys.PlatformWebhooksReplay)
  replay(@Param('eventId') eventId: string) {
    return this.webhooks.replay(eventId);
  }
}

type RequestLike = {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
};

function requestMeta(req: RequestLike) {
  const userAgent = req.headers['user-agent'];
  return {
    ip: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: Array.isArray(userAgent) ? userAgent.join(', ') : userAgent ?? null
  };
}
