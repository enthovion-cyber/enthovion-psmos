import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocHistoryService {
  constructor(private readonly db: SupabaseService) {}

  async list(tenantId: string, id: string, scope: Scope, filters: Record<string, any> = {}) {
    await this.getMoc(tenantId, id, scope);
    let query = this.db.from('moc_history_events').select('*').eq('tenant_id', tenantId).eq('moc_id', id);
    if (filters.category) query = query.eq('event_category', filters.category);
    if (filters.event_type) query = query.eq('event_type', filters.event_type);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.safety_critical !== undefined) query = query.eq('is_safety_critical', filters.safety_critical === 'true' || filters.safety_critical === true);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,event_title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,event_type.ilike.%${filters.search}%`);
    const limit = Math.min(Number(filters.limit ?? 50), 200);
    const page = Math.max(Number(filters.page ?? 1), 1);
    return this.db.many<any>(query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1));
  }

  async summary(tenantId: string, id: string, scope: Scope) {
    const events = await this.list(tenantId, id, scope, { limit: 200 });
    const categories = events.reduce((acc: Record<string, number>, event) => {
      const key = event.event_category ?? 'General';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return { totalEvents: events.length, safetyCriticalEvents: events.filter((event) => event.is_safety_critical).length, firstEventAt: events.at(-1)?.created_at ?? null, lastEventAt: events[0]?.created_at ?? null, categories };
  }

  async getEvent(tenantId: string, id: string, eventId: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    const event = await this.db.single<any>(this.db.from('moc_history_events').select('*').eq('tenant_id', tenantId).eq('moc_id', id).eq('id', eventId).maybeSingle());
    if (!event) throw new NotFoundException('MOC history event not found');
    return event;
  }

  async export(tenantId: string, id: string, scope: Scope, format: 'csv' | 'pdf') {
    const events = await this.list(tenantId, id, scope, { limit: 500 });
    if (format === 'csv') {
      const header = 'created_at,event_category,event_type,event_title,user_id,is_safety_critical';
      const rows = events.map((e) => [e.created_at, e.event_category, e.event_type, e.event_title ?? e.title, e.user_id ?? e.actor_id, e.is_safety_critical].map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','));
      return { fileName: `moc-${id}-history.csv`, mimeType: 'text/csv', content: [header, ...rows].join('\n') };
    }
    return { fileName: `moc-${id}-history.json`, mimeType: 'application/json', content: JSON.stringify({ generatedAt: new Date().toISOString(), events }, null, 2) };
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (scope.selectedSiteId && moc.site_id !== scope.selectedSiteId) throw new NotFoundException('MOC not found for selected site');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new NotFoundException('MOC not found for allowed sites');
    return moc;
  }
}
