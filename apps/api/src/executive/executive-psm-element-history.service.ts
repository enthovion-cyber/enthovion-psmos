import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class ExecutivePsmElementHistoryService {
  constructor(private readonly db: SupabaseService) {}
  async logEvent(companyId: string, event: Record<string, any>) {
    return this.db.client.from('executive_psm_element_history_events').insert({
      company_id: companyId,
      ...event,
      created_at: new Date().toISOString(),
    });
  }
}
