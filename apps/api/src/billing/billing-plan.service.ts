import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class BillingPlanService {
  constructor(private readonly db: SupabaseService) {}

  list(publicOnly = false) {
    let query = this.db.from('subscription_plans').select('*, prices:subscription_plan_prices(*), entitlements:subscription_plan_entitlements(*)').is('deleted_at', null).order('sort_order', { ascending: true });
    if (publicOnly) query = query.eq('public_visible', true).eq('status', 'active');
    return this.db.many<any>(query);
  }

  async get(planId: string) {
    const plan = await this.db.single<any>(
      this.db.from('subscription_plans').select('*, prices:subscription_plan_prices(*), entitlements:subscription_plan_entitlements(*)').eq('id', planId).maybeSingle()
    );
    if (!plan) throw new NotFoundException('Billing plan not found.');
    return plan;
  }

  async getByCode(code: string) {
    const plan = await this.db.single<any>(
      this.db.from('subscription_plans').select('*, prices:subscription_plan_prices(*), entitlements:subscription_plan_entitlements(*)').eq('code', code).maybeSingle()
    );
    if (!plan) throw new NotFoundException(`Billing plan ${code} not found.`);
    return plan;
  }

  async assertPrice(planId: string, priceId?: string | null) {
    const prices = await this.db.many<any>(this.db.from('subscription_plan_prices').select('*').eq('plan_id', planId).eq('status', 'active'));
    if (!prices.length) throw new BadRequestException('Selected plan has no active backend price.');
    if (!priceId) return prices[0];
    const price = prices.find((candidate) => candidate.id === priceId || candidate.provider_price_id === priceId);
    if (!price) throw new BadRequestException('Selected price does not belong to the selected backend plan.');
    return price;
  }
}
