import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class BillingAdminOverrideService {
  constructor(private readonly db: SupabaseService) {}

  create(companyId: string, body: Record<string, unknown>) {
    return this.db.single(this.db.from('billing_admin_overrides').insert({ id: crypto.randomUUID(), company_id: companyId, ...body }).select().single());
  }
}
