import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class CompanyEntitlementService {
  constructor(private readonly db: SupabaseService) {}

  list(companyId: string) {
    return this.db.many<any>(this.db.from('company_entitlements').select('*').eq('company_id', companyId).order('entitlement_key'));
  }

  async applyPlan(companyId: string, planId: string, actorId?: string | null) {
    const planEntitlements = await this.db.many<any>(this.db.from('subscription_plan_entitlements').select('*').eq('plan_id', planId));
    const rows = planEntitlements.map((item) => ({
      id: crypto.randomUUID(),
      company_id: companyId,
      plan_id: planId,
      source: 'plan',
      entitlement_key: item.entitlement_key,
      entitlement_type: item.entitlement_type,
      enabled: item.enabled,
      limit_value: item.limit_value,
      limit_unit: item.limit_unit,
      config_json: item.config_json ?? {},
      effective_from: new Date().toISOString(),
      created_by: actorId ?? null,
      updated_by: actorId ?? null
    }));
    for (const row of rows) {
      await this.db.single(
        this.db.from('company_entitlements').upsert(row, { onConflict: 'company_id,entitlement_key' }).select().single()
      );
    }
    return this.list(companyId);
  }

  async check(companyId: string, key: string, requestedValue = 1) {
    const entitlement = await this.db.single<any>(this.db.from('company_entitlements').select('*').eq('company_id', companyId).eq('entitlement_key', key).maybeSingle());
    if (!entitlement) {
      return { allowed: false, reason: 'This feature is not included in the current company plan.', requiredPlan: null, entitlementKey: key };
    }
    if (!entitlement.enabled) {
      return {
        allowed: false,
        reason: entitlement.config_json?.disabledReason ?? 'This feature is disabled by the current company plan.',
        requiredPlan: entitlement.config_json?.requiredPlan ?? null,
        entitlement
      };
    }
    if (entitlement.limit_value !== null && entitlement.limit_value !== undefined && requestedValue > Number(entitlement.limit_value)) {
      return { allowed: false, reason: `Plan limit exceeded for ${key}.`, entitlement, limit: Number(entitlement.limit_value), requestedValue };
    }
    return { allowed: true, entitlement };
  }

  moduleKey(moduleKey: string) {
    return moduleKey.startsWith('module.') ? moduleKey : `module.${moduleKey}`;
  }
}
