import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class IsolationRepository {
  constructor(private readonly db: SupabaseService) {}

  list(tenantId: string, permitId: string) {
    return this.db.many(this.db.from('permit_isolations').select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at'));
  }
}
