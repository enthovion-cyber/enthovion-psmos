import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import {
  OP_UPCOMING_WINDOW_DAYS,
  opAccessTypes,
  opCertificationStatuses,
  opCriticalityLevels,
  opEditableFields,
  opOperatingModes,
  opProcedureStatuses,
  opReadOnlyStatuses,
  opScopeTypes
} from './operating-procedures.constants';

export type OpScope = {
  companyId: string;
  selectedSiteId?: string | null | undefined;
  siteIds?: string[] | undefined;
  corporateView?: boolean | undefined;
  isCompanyAdmin?: boolean | undefined;
  isSiteAdmin?: boolean | undefined;
};

type Row = Record<string, any>;

const SORTABLE = new Set(['updated_at', 'created_at', 'procedure_number', 'title', 'next_certification_due', 'procedure_status', 'criticality']);

@Injectable()
export class OperatingProceduresService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- Lookups
  async lookups(scope: OpScope) {
    const [types, categories] = await Promise.all([
      this.db.many<Row>(this.db.from('op_procedure_types').select('*').eq('company_id', scope.companyId).eq('active', true).order('sort_order')),
      this.db.many<Row>(this.db.from('op_procedure_categories').select('*').eq('company_id', scope.companyId).eq('active', true).order('sort_order'))
    ]);
    return {
      types,
      categories,
      statuses: opProcedureStatuses,
      certificationStatuses: opCertificationStatuses,
      criticalityLevels: opCriticalityLevels,
      operatingModes: opOperatingModes,
      scopeTypes: opScopeTypes
    };
  }

  // ---------------------------------------------------------------- Register
  async register(scope: OpScope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(500, Math.max(1, Number(query.limit ?? 25)));
    let q = this.db.from('op_procedures').select('*', { count: 'exact' }).eq('company_id', scope.companyId);
    q = this.applyScope(q, scope, query);
    if (!query.includeArchived && query.status !== 'Archived') q = q.is('archived_at', null);
    if (query.status) q = q.eq('procedure_status', query.status);
    if (query.certificationStatus) q = q.eq('certification_status', query.certificationStatus);
    if (query.typeCode) q = q.eq('procedure_type_code', query.typeCode);
    if (query.categoryId) q = q.eq('category_id', query.categoryId);
    if (query.criticality) q = q.eq('criticality', query.criticality);
    if (query.ownerUserId) q = q.eq('owner_user_id', query.ownerUserId);
    if (query.swp === 'true' || query.swp === true) q = q.eq('is_safe_work_practice', true);
    if (query.psmCovered === 'true' || query.psmCovered === true) q = q.eq('is_psm_covered', true);
    if (query.overdue === 'true' || query.overdue === true) q = q.lt('next_certification_due', this.today());
    if (query.search) {
      const term = String(query.search).replace(/[%,()]/g, ' ').trim();
      if (term) q = q.or(`title.ilike.%${term}%,procedure_number.ilike.%${term}%,purpose.ilike.%${term}%`);
    }
    const [sortCol, sortDir] = String(query.sort ?? 'updated_at.desc').split('.');
    q = q.order(SORTABLE.has(sortCol ?? '') ? sortCol! : 'updated_at', { ascending: sortDir === 'asc' }).range((page - 1) * limit, page * limit - 1);
    const { data, error, count } = await q;
    if (error) throw new BadRequestException(error.message);
    const items = (data ?? []).map((row: Row) => this.enrich(row));
    return { items, total: count ?? 0, page, limit, summary: await this.summary(scope, query) };
  }

  async summary(scope: OpScope, query: Row = {}) {
    let q = this.db.from('op_procedures').select('procedure_status, certification_status, next_certification_due, criticality, is_safe_work_practice, is_temporary, temporary_expires_at, procedure_type_code').eq('company_id', scope.companyId).is('archived_at', null);
    q = this.applyScope(q, scope, query);
    const rows = await this.db.many<Row>(q);
    const today = this.today();
    const in30 = this.addDays(today, 30);
    const enriched: Row[] = rows.map((r: Row) => ({ ...r, certification_status: this.computeCertStatus(r) }));
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const r of enriched) {
      byStatus[r.procedure_status] = (byStatus[r.procedure_status] ?? 0) + 1;
      byType[r.procedure_type_code] = (byType[r.procedure_type_code] ?? 0) + 1;
    }
    const published = enriched.filter((r) => r.procedure_status === 'Published');
    const certifiedCurrent = published.filter((r) => r.next_certification_due && r.next_certification_due >= today).length;
    return {
      total: enriched.length,
      published: published.length,
      draft: byStatus['Draft'] ?? 0,
      inReview: (byStatus['In Review'] ?? 0) + (byStatus['Review Complete'] ?? 0) + (byStatus['Pending Approval'] ?? 0),
      underRevision: byStatus['Under Revision'] ?? 0,
      overdueCertification: enriched.filter((r) => r.certification_status === 'Overdue').length,
      dueNext30: enriched.filter((r) => r.next_certification_due && r.next_certification_due >= today && r.next_certification_due <= in30).length,
      certifiedCurrentPct: published.length ? Math.round((certifiedCurrent / published.length) * 100) : 0,
      highCriticality: enriched.filter((r) => r.criticality === 'High').length,
      safeWorkPractices: enriched.filter((r) => r.is_safe_work_practice).length,
      temporaryExpiring: enriched.filter((r) => r.is_temporary && r.temporary_expires_at && r.temporary_expires_at <= in30).length,
      byStatus,
      byType
    };
  }

  async dashboard(scope: OpScope, query: Row = {}) {
    const summary = await this.summary(scope, query);
    let dueQ = this.db.from('op_procedures').select('id, procedure_number, title, next_certification_due, owner_user_id, procedure_status').eq('company_id', scope.companyId).is('archived_at', null).not('next_certification_due', 'is', null).order('next_certification_due', { ascending: true }).limit(10);
    dueQ = this.applyScope(dueQ, scope, query);
    let recentQ = this.db.from('op_procedures').select('id, procedure_number, title, procedure_status, updated_at').eq('company_id', scope.companyId).order('updated_at', { ascending: false }).limit(10);
    recentQ = this.applyScope(recentQ, scope, query);
    const [upcomingCertifications, recentlyUpdated] = await Promise.all([this.db.many<Row>(dueQ), this.db.many<Row>(recentQ)]);
    return { summary, upcomingCertifications: upcomingCertifications.map((r) => this.enrich(r)), recentlyUpdated, coverage: await this.coverageMatrix(scope, query) };
  }

  /** (f)(1) coverage: for each PSM-required procedure type, how many published procedures exist per unit. */
  async coverageMatrix(scope: OpScope, query: Row = {}) {
    const types = await this.db.many<Row>(this.db.from('op_procedure_types').select('type_code, type_name, phase_group, osha_reference').eq('company_id', scope.companyId).eq('is_psm_required', true).eq('active', true).order('sort_order'));
    let q = this.db.from('op_procedures').select('unit_id, procedure_type_code, procedure_status').eq('company_id', scope.companyId).is('archived_at', null).eq('is_psm_covered', true);
    q = this.applyScope(q, scope, query);
    const rows = await this.db.many<Row>(q);
    const units = Array.from(new Set(rows.map((r) => r.unit_id ?? 'UNASSIGNED')));
    const cells = types.map((t) => ({
      ...t,
      units: units.map((unitId) => {
        const matches = rows.filter((r) => (r.unit_id ?? 'UNASSIGNED') === unitId && r.procedure_type_code === t.type_code);
        return { unitId, total: matches.length, published: matches.filter((m) => m.procedure_status === 'Published').length };
      })
    }));
    return { units, types: cells, gaps: cells.reduce((acc, t) => acc + t.units.filter((u) => u.published === 0).length, 0) };
  }

  // ---------------------------------------------------------------- Detail / CRUD
  async getProcedure(scope: OpScope, id: string, userId?: string) {
    const row = await this.loadProcedure(scope, id);
    const [scopes, type, category] = await Promise.all([
      this.db.many<Row>(this.db.from('op_procedure_scopes').select('*').eq('procedure_id', id).is('removed_at', null).order('linked_at')),
      row.procedure_type_id ? this.db.single<Row>(this.db.from('op_procedure_types').select('*').eq('id', row.procedure_type_id).maybeSingle()) : null,
      row.category_id ? this.db.single<Row>(this.db.from('op_procedure_categories').select('*').eq('id', row.category_id).maybeSingle()) : null
    ]);
    if (userId) await this.logAccess(scope, userId, id, { accessType: 'View', channel: 'web' }).catch(() => null);
    return { ...this.enrich(row), scopes, type, category, permissions: { editable: !row.locked && !opReadOnlyStatuses.has(row.procedure_status) && !row.archived_at } };
  }

  async createProcedure(userId: string, scope: OpScope, dto: Row) {
    const title = String(dto.title ?? '').trim();
    if (title.length < 3) throw new BadRequestException('Title is required (min 3 characters).');
    if (!dto.typeCode) throw new BadRequestException('Procedure type is required.');
    const siteId = dto.siteId ?? scope.selectedSiteId ?? null;
    if (!this.canAccessSite(scope, siteId)) throw new ForbiddenException('You cannot create procedures for this site.');
    const type = await this.db.single<Row>(this.db.from('op_procedure_types').select('*').eq('company_id', scope.companyId).eq('type_code', dto.typeCode).maybeSingle());
    if (!type) throw new BadRequestException(`Unknown procedure type: ${dto.typeCode}`);
    this.validateEnums(dto);
    const settings = await this.settings(scope, siteId);
    const frequency = Number(dto.reviewFrequencyMonths ?? type.default_review_frequency_months ?? settings.default_review_frequency_months ?? 12);
    const procedureNumber = dto.procedureNumber?.trim() || (await this.nextNumber(scope, type.number_prefix, dto.unitCode ?? null, siteId));
    const row: Row = {
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: siteId,
      procedure_number: procedureNumber,
      title,
      procedure_type_id: type.id,
      procedure_type_code: type.type_code,
      is_safe_work_practice: type.is_safe_work_practice,
      is_psm_covered: dto.isPsmCovered ?? true,
      review_frequency_months: frequency,
      owner_user_id: dto.ownerUserId ?? userId,
      procedure_status: 'Draft',
      certification_status: 'Not Due',
      regulatory_basis: dto.regulatoryBasis ?? (type.osha_reference ? [type.osha_reference] : []),
      created_by: userId,
      updated_by: userId
    };
    for (const [key, col] of Object.entries(opEditableFields)) if (dto[key] !== undefined && row[col] === undefined) row[col] = dto[key];
    const existing = await this.db.single<Row>(this.db.from('op_procedures').select('id').eq('company_id', scope.companyId).eq('procedure_number', procedureNumber).maybeSingle());
    if (existing) throw new BadRequestException(`Procedure number ${procedureNumber} already exists.`);
    const created = await this.db.single<Row>(this.db.from('op_procedures').insert(row).select('*').single());
    if (Array.isArray(dto.scopes)) for (const s of dto.scopes) await this.addScope(userId, scope, created!.id, s, false);
    await this.writeHistory(scope, userId, 'Procedure Created', null, created, `Created ${procedureNumber}`, created!.id);
    return this.getProcedure(scope, created!.id);
  }

  async updateProcedure(userId: string, scope: OpScope, id: string, dto: Row) {
    const before = await this.loadProcedure(scope, id);
    this.assertEditable(before);
    this.validateEnums(dto);
    if (dto.siteId !== undefined && !this.canAccessSite(scope, dto.siteId)) throw new ForbiddenException('You cannot move procedures to this site.');
    const patch: Row = { updated_by: userId, updated_at: new Date().toISOString() };
    for (const [key, col] of Object.entries(opEditableFields)) if (dto[key] !== undefined) patch[col] = dto[key];
    if (dto.title !== undefined && String(dto.title).trim().length < 3) throw new BadRequestException('Title must be at least 3 characters.');
    if (patch.review_frequency_months !== undefined && before.last_certified_at) patch.next_certification_due = this.addMonths(before.last_certified_at, Number(patch.review_frequency_months));
    const after = await this.db.single<Row>(this.db.from('op_procedures').update(patch).eq('id', id).eq('company_id', scope.companyId).select('*').single());
    await this.writeHistory(scope, userId, 'Procedure Updated', before, after, dto.reason ?? 'Header fields updated', id);
    return this.getProcedure(scope, id);
  }

  async archive(userId: string, scope: OpScope, id: string, dto: Row) {
    const before = await this.loadProcedure(scope, id);
    if (before.archived_at) throw new BadRequestException('Procedure is already archived.');
    if (!dto.reason || String(dto.reason).trim().length < 5) throw new BadRequestException('Archive reason is required (min 5 characters).');
    const after = await this.db.single<Row>(this.db.from('op_procedures').update({ procedure_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('id', id).select('*').single());
    await this.writeHistory(scope, userId, 'Procedure Archived', before, after, dto.reason, id);
    return this.getProcedure(scope, id);
  }

  async reactivate(userId: string, scope: OpScope, id: string, dto: Row) {
    const before = await this.loadProcedure(scope, id);
    if (!before.archived_at) throw new BadRequestException('Procedure is not archived.');
    const after = await this.db.single<Row>(this.db.from('op_procedures').update({ procedure_status: 'Draft', archived_at: null, archived_by: null, archive_reason: null, updated_by: userId, updated_at: new Date().toISOString() }).eq('id', id).select('*').single());
    await this.writeHistory(scope, userId, 'Procedure Reactivated', before, after, dto.reason ?? 'Reactivated as draft', id);
    return this.getProcedure(scope, id);
  }

  async lock(userId: string, scope: OpScope, id: string, dto: Row, locked: boolean) {
    const before = await this.loadProcedure(scope, id);
    if (before.locked === locked) throw new BadRequestException(locked ? 'Procedure is already locked.' : 'Procedure is not locked.');
    const patch = locked ? { locked: true, locked_by: userId, locked_at: new Date().toISOString(), lock_reason: dto.reason ?? null } : { locked: false, locked_by: null, locked_at: null, lock_reason: null };
    const after = await this.db.single<Row>(this.db.from('op_procedures').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('id', id).select('*').single());
    await this.writeHistory(scope, userId, locked ? 'Procedure Locked' : 'Procedure Unlocked', before, after, dto.reason ?? '', id);
    return this.getProcedure(scope, id);
  }

  async assignOwner(userId: string, scope: OpScope, id: string, dto: Row) {
    const before = await this.loadProcedure(scope, id);
    if (!dto.ownerUserId) throw new BadRequestException('ownerUserId is required.');
    const patch: Row = { owner_user_id: dto.ownerUserId, updated_by: userId, updated_at: new Date().toISOString() };
    if (Array.isArray(dto.smeUserIds)) patch.sme_user_ids = dto.smeUserIds;
    const after = await this.db.single<Row>(this.db.from('op_procedures').update(patch).eq('id', id).select('*').single());
    await this.writeHistory(scope, userId, 'Owner Assigned', before, after, dto.reason ?? 'Owner / SMEs reassigned', id);
    return this.getProcedure(scope, id);
  }

  // ---------------------------------------------------------------- Scopes
  async addScope(userId: string, scope: OpScope, procedureId: string, dto: Row, log = true) {
    const proc = await this.loadProcedure(scope, procedureId);
    if (!opScopeTypes.includes(dto.scopeType)) throw new BadRequestException(`Invalid scope type. Allowed: ${opScopeTypes.join(', ')}`);
    const row = await this.db.single<Row>(this.db.from('op_procedure_scopes').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: proc.site_id, procedure_id: procedureId, scope_type: dto.scopeType, scope_record_id: dto.scopeRecordId ?? null, scope_label: dto.scopeLabel ?? null, linked_by: userId }).select('*').single());
    if (log) await this.writeHistory(scope, userId, 'Scope Added', null, row, `${dto.scopeType}: ${dto.scopeLabel ?? dto.scopeRecordId ?? ''}`, procedureId);
    return row;
  }

  async removeScope(userId: string, scope: OpScope, procedureId: string, scopeId: string, dto: Row) {
    await this.loadProcedure(scope, procedureId);
    const before = await this.db.single<Row>(this.db.from('op_procedure_scopes').select('*').eq('id', scopeId).eq('procedure_id', procedureId).maybeSingle());
    if (!before) throw new NotFoundException('Scope not found.');
    const after = await this.db.single<Row>(this.db.from('op_procedure_scopes').update({ removed_at: new Date().toISOString(), removed_by: userId, remove_reason: dto.reason ?? null }).eq('id', scopeId).select('*').single());
    await this.writeHistory(scope, userId, 'Scope Removed', before, after, dto.reason ?? '', procedureId);
    return after;
  }

  // ---------------------------------------------------------------- History / Access
  async history(scope: OpScope, procedureId: string) {
    await this.loadProcedure(scope, procedureId);
    return this.db.many<Row>(this.db.from('op_history_events').select('*').eq('company_id', scope.companyId).eq('procedure_id', procedureId).order('created_at', { ascending: false }).limit(500));
  }

  async accessLog(scope: OpScope, procedureId: string) {
    await this.loadProcedure(scope, procedureId);
    return this.db.many<Row>(this.db.from('op_access_logs').select('*').eq('company_id', scope.companyId).eq('procedure_id', procedureId).order('created_at', { ascending: false }).limit(1000));
  }

  async logAccess(scope: OpScope, userId: string, procedureId: string, dto: Row) {
    const proc = await this.loadProcedure(scope, procedureId);
    const accessType = dto.accessType ?? 'View';
    if (!opAccessTypes.includes(accessType)) throw new BadRequestException('Invalid access type.');
    return this.db.single<Row>(this.db.from('op_access_logs').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: proc.site_id, procedure_id: procedureId, revision_id: proc.current_revision_id, user_id: userId, access_type: accessType, channel: dto.channel ?? null }).select('id').single());
  }

  // ---------------------------------------------------------------- Settings
  async settings(scope: OpScope, siteId?: string | null) {
    const rows = await this.db.many<Row>(this.db.from('op_settings').select('*').eq('company_id', scope.companyId));
    return rows.find((r) => siteId && r.site_id === siteId) ?? rows.find((r) => !r.site_id) ?? { default_review_frequency_months: 12, execution_ack_gate: 'Warn' };
  }

  async updateSettings(userId: string, scope: OpScope, dto: Row) {
    const siteId = dto.siteId ?? null;
    const allowed = ['default_review_frequency_months', 'certification_grace_days', 'reminder_days', 'require_two_person_approval', 'lock_on_publish', 'require_moc_for_revision', 'block_moc_closure_on_open_flags', 'execution_ack_gate', 'number_format', 'uncontrolled_print_watermark'];
    const patch: Row = { updated_by: userId, updated_at: new Date().toISOString() };
    for (const k of allowed) {
      const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (dto[camel] !== undefined) patch[k] = dto[camel];
    }
    if (patch.execution_ack_gate && !['Off', 'Warn', 'Block'].includes(patch.execution_ack_gate)) throw new BadRequestException('executionAckGate must be Off, Warn or Block.');
    const existing = await this.db.single<Row>((siteId ? this.db.from('op_settings').select('*').eq('company_id', scope.companyId).eq('site_id', siteId) : this.db.from('op_settings').select('*').eq('company_id', scope.companyId).is('site_id', null)).maybeSingle());
    const after = existing
      ? await this.db.single<Row>(this.db.from('op_settings').update(patch).eq('id', existing.id).select('*').single())
      : await this.db.single<Row>(this.db.from('op_settings').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: siteId, ...patch }).select('*').single());
    await this.writeHistory(scope, userId, 'Settings Updated', existing, after, 'Operating procedure settings updated', null);
    return after;
  }

  // ---------------------------------------------------------------- Helpers
  private async loadProcedure(scope: OpScope, id: string) {
    const row = await this.db.single<Row>(this.db.from('op_procedures').select('*').eq('company_id', scope.companyId).eq('id', id).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Procedure was not found or is outside your company/site scope.');
    return row;
  }

  private assertEditable(row: Row) {
    if (row.archived_at) throw new BadRequestException('Archived procedures cannot be edited. Reactivate first.');
    if (row.locked) throw new BadRequestException(`Procedure is locked${row.lock_reason ? `: ${row.lock_reason}` : ''}.`);
    if (opReadOnlyStatuses.has(row.procedure_status)) throw new BadRequestException(`Procedure is ${row.procedure_status}; start a new revision to make changes.`);
  }

  private validateEnums(dto: Row) {
    if (dto.criticality !== undefined && !opCriticalityLevels.includes(dto.criticality)) throw new BadRequestException('Invalid criticality.');
    if (dto.operatingMode !== undefined && dto.operatingMode !== null && !opOperatingModes.includes(dto.operatingMode)) throw new BadRequestException('Invalid operating mode.');
    if (dto.reviewFrequencyMonths !== undefined) {
      const n = Number(dto.reviewFrequencyMonths);
      if (!Number.isInteger(n) || n < 1 || n > 60) throw new BadRequestException('Review frequency must be 1-60 months.');
    }
    if (dto.isTemporary && !dto.temporaryExpiresAt) throw new BadRequestException('Temporary procedures require an expiry date.');
  }

  private async nextNumber(scope: OpScope, prefix: string, unitCode: string | null, siteId: string | null) {
    const scopeKey = (unitCode ?? 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GEN';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      let rule = await this.db.single<Row>(this.db.from('op_numbering_rules').select('*').eq('company_id', scope.companyId).eq('prefix', prefix).eq('scope_key', scopeKey).maybeSingle());
      if (!rule) {
        rule = await this.db.single<Row>(this.db.from('op_numbering_rules').upsert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: siteId, prefix, scope_key: scopeKey, next_sequence: 1 }, { onConflict: 'company_id,prefix,scope_key', ignoreDuplicates: true }).select('*').maybeSingle());
        if (!rule) continue;
      }
      const seq = Number(rule.next_sequence);
      // optimistic concurrency: only advance if nobody else did
      const advanced = await this.db.many<Row>(this.db.from('op_numbering_rules').update({ next_sequence: seq + 1, updated_at: new Date().toISOString() }).eq('id', rule.id).eq('next_sequence', seq).select('id'));
      if (advanced.length) return `${prefix}-${scopeKey}-${String(seq).padStart(Number(rule.padding ?? 4), '0')}`;
    }
    throw new BadRequestException('Unable to allocate a procedure number, please retry.');
  }

  private enrich(row: Row) {
    const certificationStatus = this.computeCertStatus(row);
    const daysToDue = row.next_certification_due ? Math.round((Date.parse(row.next_certification_due) - Date.parse(this.today())) / 86_400_000) : null;
    return { ...row, certification_status: certificationStatus, days_to_certification_due: daysToDue };
  }

  /** Derive certification status from dates so the register is always correct even before the scheduler runs. */
  private computeCertStatus(row: Row): string {
    if (!row.next_certification_due) return row.certification_status ?? 'Not Due';
    if (row.procedure_status !== 'Published' && row.procedure_status !== 'Under Revision') return row.certification_status ?? 'Not Due';
    const today = this.today();
    if (row.next_certification_due < today) return 'Overdue';
    if (row.next_certification_due === today) return 'Due';
    if (row.next_certification_due <= this.addDays(today, OP_UPCOMING_WINDOW_DAYS)) return 'Upcoming';
    return row.certification_status === 'Certified With Changes' ? row.certification_status : 'Certified';
  }

  private applyScope(q: any, scope: OpScope, query: Row) {
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    else if (!scope.corporateView && !scope.isCompanyAdmin && scope.siteIds?.length) q = q.or(`site_id.is.null,site_id.in.(${scope.siteIds.join(',')})`);
    if (query.siteId) q = q.eq('site_id', query.siteId);
    if (query.unitId) q = q.eq('unit_id', query.unitId);
    if (query.areaId) q = q.eq('area_id', query.areaId);
    if (query.equipmentId) q = q.eq('equipment_id', query.equipmentId);
    return q;
  }

  private canAccessSite(scope: OpScope, siteId?: string | null) {
    if (!siteId) return true;
    if (scope.corporateView || scope.isCompanyAdmin) return true;
    return (scope.siteIds ?? []).includes(siteId);
  }

  private async writeHistory(scope: OpScope, userId: string, title: string, before: Row | null, after: Row | null, reason: string, procedureId: string | null) {
    const audit = await this.audit.write({ tenantId: scope.companyId, actorId: userId, action: title, entityType: 'OperatingProcedure', ...(procedureId ? { entityId: procedureId } : {}), before: before ?? null, after: after ?? null, metadata: { reason, sourceModule: 'Operating Procedures' } } as Parameters<AuditService['write']>[0]).catch(() => null);
    await this.db.single(this.db.from('op_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      procedure_id: procedureId,
      revision_id: after?.current_revision_id ?? before?.current_revision_id ?? null,
      event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      event_title: title,
      event_description: reason,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: userId,
      audit_log_id: (audit as { id?: string } | null)?.id ?? null
    }).select('id').single()).catch(() => null);
  }

  private today() { return new Date().toISOString().slice(0, 10); }
  private addDays(date: string, days: number) { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
  private addMonths(date: string, months: number) { const d = new Date(`${String(date).slice(0, 10)}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + months); return d.toISOString().slice(0, 10); }
}
