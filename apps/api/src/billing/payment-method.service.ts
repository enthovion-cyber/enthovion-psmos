import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class PaymentMethodService {
  constructor(private readonly db: SupabaseService) {}

  list(companyId: string) {
    return this.db.many<any>(this.db.from('billing_payment_methods').select('*').eq('company_id', companyId).order('created_at', { ascending: false }));
  }

  async setDefault(companyId: string, paymentMethodId: string) {
    const method = await this.db.single<any>(this.db.from('billing_payment_methods').select('*').eq('company_id', companyId).eq('id', paymentMethodId).maybeSingle());
    if (!method) throw new NotFoundException('Payment method not found.');
    await this.db.many(this.db.from('billing_payment_methods').update({ is_default: false }).eq('company_id', companyId));
    return this.db.single(this.db.from('billing_payment_methods').update({ is_default: true, updated_at: new Date().toISOString() }).eq('company_id', companyId).eq('id', paymentMethodId).select().single());
  }
}
