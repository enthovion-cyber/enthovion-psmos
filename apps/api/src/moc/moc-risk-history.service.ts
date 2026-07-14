import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class MocRiskHistoryService {
  constructor(private readonly db: SupabaseService) {}

  list(tenantId: string, mocId: string) {
    return this.db.many<any>(this.db.from('moc_risk_history').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).order('created_at', { ascending: false }));
  }

  write(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: any, after: any, description?: string) {
    return this.db.single(this.db.from('moc_risk_history').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      risk_assessment_id: after?.id ?? before?.id ?? null,
      event_type: eventType,
      title,
      description: description ?? null,
      actor_id: actorId,
      before_value: before ?? null,
      after_value: after ?? null,
      risk_score_before: before?.total_score ?? before?.after_score ?? null,
      risk_score_after: after?.total_score ?? after?.after_score ?? null,
      risk_level_before: before?.risk_level ?? before?.after_level ?? null,
      risk_level_after: after?.risk_level ?? after?.after_level ?? null
    }).select().single());
  }
}
