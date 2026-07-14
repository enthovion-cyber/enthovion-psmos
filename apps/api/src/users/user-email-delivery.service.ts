import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class UserEmailDeliveryService {
  constructor(private readonly db: SupabaseService) {}

  listForUser(tenantId: string, userId: string) {
    return this.db.many(this.db.from('UserEmailDeliveryLog').select('*').eq('tenantId', tenantId).eq('userId', userId).order('createdAt', { ascending: false })).catch(() => []);
  }
}
