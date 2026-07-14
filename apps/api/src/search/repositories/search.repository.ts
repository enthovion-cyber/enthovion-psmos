import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { SearchQueryDto } from '../dto/search-query.dto';

export type SearchIndexRecord = {
  id: string;
  tenantId: string;
  siteId?: string | null;
  moduleKey: string;
  entityType: string;
  entityId: string;
  recordType?: string | null;
  recordNumber?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  url?: string | null;
  text: string;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt: string;
};

@Injectable()
export class SearchRepository {
  constructor(private readonly db: SupabaseService) {}

  async query(tenantId: string, dto: SearchQueryDto, allowedModules: string[], allowedSiteIds: string[]) {
    if (!allowedModules.length) return [];
    const term = sanitizeTerm(dto.q ?? '');
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    let query = this.db.from('SearchIndex').select('*').eq('tenantId', tenantId);
    if (allowedModules.length) query = query.in('moduleKey', allowedModules);
    if (dto.module) query = query.ilike('moduleKey', dto.module);
    if (dto.siteId) query = query.eq('siteId', dto.siteId);
    else if (allowedSiteIds.length) query = query.or(`siteId.is.null,siteId.in.(${allowedSiteIds.join(',')})`);
    if (dto.status) query = query.ilike('status', dto.status);
    if (term) {
      query = query.or([
        `title.ilike.%${term}%`,
        `subtitle.ilike.%${term}%`,
        `recordNumber.ilike.%${term}%`,
        `text.ilike.%${term}%`
      ].join(','));
    }
    const rows = await this.db.many<SearchIndexRecord>(query.order('updatedAt', { ascending: false }).range(offset, offset + limit - 1));
    return rows
      .map((row) => ({ ...row, score: scoreResult(row, term) }))
      .sort((a, b) => b.score - a.score || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async suggestions(tenantId: string, q: string, allowedModules: string[], allowedSiteIds: string[]) {
    if (!allowedModules.length) return [];
    const term = sanitizeTerm(q);
    if (term.length < 2) return [];
    let query = this.db.from('SearchIndex')
      .select('id,moduleKey,entityType,entityId,recordNumber,title,subtitle,url,updatedAt')
      .eq('tenantId', tenantId);
    if (allowedModules.length) query = query.in('moduleKey', allowedModules);
    if (allowedSiteIds.length) query = query.or(`siteId.is.null,siteId.in.(${allowedSiteIds.join(',')})`);
    query = query.or(`title.ilike.%${term}%,recordNumber.ilike.%${term}%,text.ilike.%${term}%`);
    return this.db.many(query.order('updatedAt', { ascending: false }).limit(8));
  }

  upsert(record: SearchIndexRecord) {
    return this.db.single(
      this.db.from('SearchIndex')
        .upsert(record, { onConflict: 'tenantId,entityType,entityId' })
        .select()
        .single()
    );
  }

  remove(tenantId: string, moduleKey: string, recordId: string) {
    return this.db.single(
      this.db.from('SearchIndex')
        .delete()
        .eq('tenantId', tenantId)
        .eq('moduleKey', moduleKey)
        .eq('entityId', recordId)
        .select()
        .maybeSingle()
    );
  }

  addHistory(tenantId: string, userId: string, query: string, selectedRecordId?: string, selectedModule?: string) {
    return this.db.single(
      this.db.from('SearchHistory').insert({
        id: crypto.randomUUID(),
        tenantId,
        userId,
        query,
        selectedRecordId: selectedRecordId ?? null,
        selectedModule: selectedModule ?? null
      }).select().single()
    );
  }

  recent(tenantId: string, userId: string) {
    return this.db.many(
      this.db.from('SearchHistory')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(10)
    );
  }

  clearRecent(tenantId: string, userId: string) {
    return this.db.from('SearchHistory').delete().eq('tenantId', tenantId).eq('userId', userId);
  }
}

function sanitizeTerm(term: string) {
  return term.trim().replace(/[%(),]/g, '').slice(0, 120);
}

function scoreResult(row: SearchIndexRecord, term: string) {
  if (!term) return 1;
  const q = term.toLowerCase();
  const recordNumber = row.recordNumber?.toLowerCase() ?? '';
  const title = row.title.toLowerCase();
  const subtitle = row.subtitle?.toLowerCase() ?? '';
  const text = row.text.toLowerCase();
  if (recordNumber === q || title === q) return 100;
  if (recordNumber.startsWith(q) || title.startsWith(q)) return 80;
  if (recordNumber.includes(q) || title.includes(q)) return 60;
  if (subtitle.includes(q)) return 40;
  if (text.includes(q)) return 20;
  return 1;
}
