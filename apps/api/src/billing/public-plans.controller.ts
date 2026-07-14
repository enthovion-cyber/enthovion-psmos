import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BillingPlanService } from './billing-plan.service';

@ApiTags('public plans')
@Public()
@Controller('public')
export class PublicPlansController {
  constructor(private readonly plans: BillingPlanService) {}

  @Get('plans')
  async plansList() {
    const rows = await this.plans.list(true).catch(() => []);
    return rows.map((plan: any) => publicPlan(plan));
  }

  @Get('plans/:planCode')
  async plan(@Param('planCode') planCode: string) {
    const plan = await this.plans.getByCode(planCode);
    return publicPlan(plan);
  }

  @Get('marketing-config')
  marketingConfig() {
    return {
      productName: 'Enthovion PSM OS',
      trialDays: 14,
      trialRequiresCard: false,
      paidCheckoutProvider: 'provider-checkout',
      cardCollectionInApp: false,
      contactSalesPath: '/contact?plan=enterprise'
    };
  }
}

function publicPlan(plan: any) {
  const activePrices = Array.isArray(plan?.prices) ? plan.prices.filter((price: any) => price.status === 'active') : [];
  const primaryPrice = activePrices[0] ?? null;
  return {
    code: plan.code,
    name: plan.name,
    description: plan.public_description ?? plan.description ?? null,
    features: Array.isArray(plan.public_features) ? plan.public_features : Array.isArray(plan.features_json) ? plan.features_json : [],
    limits: plan.public_limits ?? {},
    priceDisplay: plan.price_display ?? displayPrice(primaryPrice),
    trialDays: plan.trial_days ?? (plan.code === 'trial' ? 14 : null),
    ctaType: plan.code === 'enterprise' ? 'contact_sales' : plan.code === 'trial' ? 'trial' : 'checkout',
    highlighted: Boolean(plan.highlighted ?? plan.code === 'pro'),
    publicVisible: Boolean(plan.public_visible),
    sortOrder: plan.sort_order ?? 0
  };
}

function displayPrice(price: any) {
  if (!price) return null;
  if (price.price_display) return price.price_display;
  if (typeof price.amount_cents === 'number') {
    const amount = (price.amount_cents / 100).toLocaleString('en-US', { style: 'currency', currency: price.currency ?? 'USD', maximumFractionDigits: 0 });
    return `${amount}/${price.interval ?? 'month'}`;
  }
  return null;
}
