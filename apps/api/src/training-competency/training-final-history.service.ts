import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class TrainingFinalHistoryService {
  constructor(private readonly db: SupabaseService) {}
  async history(user: RequestUser, query: Record<string, any> = {}) {
    const workerHistory = await this.db.many(this.db.from('training_worker_history_events').select('*').eq('company_id', user.tenantId).limit(Number(query.limit ?? 50))).catch(() => []);
    const approvalHistory = await this.db.many(this.db.from('training_approval_history_events').select('*').eq('company_id', user.tenantId).limit(Number(query.limit ?? 50))).catch(() => []);
    const hardening = await this.db.many(this.db.from('training_final_hardening_checks').select('*').eq('company_id', user.tenantId).limit(Number(query.limit ?? 50))).catch(() => []);
    return [...workerHistory, ...approvalHistory, ...hardening].sort((a: any, b: any) => String(b.created_at ?? b.checked_at ?? '').localeCompare(String(a.created_at ?? a.checked_at ?? ''))).slice(0, Number(query.limit ?? 50));
  }
}
