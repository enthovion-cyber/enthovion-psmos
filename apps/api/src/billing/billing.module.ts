import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { BillingAuditService } from './billing-audit.service';
import { BillingAdminOverrideService } from './billing-admin-override.service';
import { BillingCheckoutService } from './billing-checkout.service';
import { BillingContextService } from './billing-context.service';
import { BillingController, PlatformBillingController } from './billing.controller';
import { BillingCustomerService } from './billing-customer.service';
import { BillingEntitlementService } from './billing-entitlement.service';
import { BillingNotificationService } from './billing-notification.service';
import { BillingProviderFactory } from './billing-provider.factory';
import { BillingPlanService } from './billing-plan.service';
import { BillingPriceService } from './billing-price.service';
import { BillingSubscriptionService } from './billing-subscription.service';
import { BillingWebhookService } from './billing-webhook.service';
import { CompanyEntitlementService } from './company-entitlement.service';
import { ExportLimitService } from './export-limit.service';
import { EntitlementGuard } from './guards/entitlement.guard';
import { BillingOwnerGuard } from './guards/billing-owner.guard';
import { BillingPermissionGuard } from './guards/billing-permission.guard';
import { BillingWebhookGuard } from './guards/billing-webhook.guard';
import { PlanLimitGuard } from './guards/plan-limit.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { UsageLimitGuard } from './guards/usage-limit.guard';
import { InvoiceService } from './invoice.service';
import { PaymentMethodService } from './payment-method.service';
import { PlanChangeService } from './plan-change.service';
import { SeatLimitService } from './seat-limit.service';
import { SiteLimitService } from './site-limit.service';
import { StorageLimitService } from './storage-limit.service';
import { SubscriptionCancelService } from './subscription-cancel.service';
import { SubscriptionReactivationService } from './subscription-reactivation.service';
import { SubscriptionStatusSyncService } from './subscription-status-sync.service';
import { UpgradeRequiredService } from './upgrade-required.service';
import { UsageCounterService } from './usage-counter.service';
import { UsageEventService } from './usage-event.service';
import { PublicPlansController } from './public-plans.controller';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule],
  controllers: [BillingController, PlatformBillingController, PublicPlansController],
  providers: [
    BillingAuditService,
    BillingAdminOverrideService,
    BillingCheckoutService,
    BillingContextService,
    BillingCustomerService,
    BillingEntitlementService,
    BillingNotificationService,
    BillingProviderFactory,
    BillingPlanService,
    BillingPriceService,
    BillingSubscriptionService,
    BillingWebhookService,
    CompanyEntitlementService,
    ExportLimitService,
    UsageCounterService,
    UsageEventService,
    InvoiceService,
    PaymentMethodService,
    PlanChangeService,
    SeatLimitService,
    SiteLimitService,
    StorageLimitService,
    SubscriptionCancelService,
    SubscriptionReactivationService,
    SubscriptionStatusSyncService,
    UpgradeRequiredService,
    BillingPermissionGuard,
    SubscriptionGuard,
    EntitlementGuard,
    PlanLimitGuard,
    UsageLimitGuard,
    BillingWebhookGuard,
    BillingOwnerGuard
  ],
  exports: [BillingSubscriptionService, CompanyEntitlementService, UsageCounterService, UsageEventService]
})
export class BillingModule {}
