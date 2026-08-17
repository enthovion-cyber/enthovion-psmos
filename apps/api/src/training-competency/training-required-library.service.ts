import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;
type Scope = { allowedSiteIds: string[]; selectedSiteId?: string | null; corporateView?: boolean };

const trainingCategories = ['Site Induction', 'Contractor Onboarding', 'Process Safety Management', 'Chemical / SDS Awareness', 'Process Chemistry', 'Safe Operating Limits', 'SOP / Procedure', 'PTW', 'LOTO / Isolation', 'Hot Work', 'Confined Space', 'Work at Height', 'Excavation', 'Lifting', 'Electrical Safety', 'Gas Testing', 'Emergency Response', 'Fire Safety', 'Environmental', 'Mechanical Integrity', 'Equipment-Specific', 'HAZOP / Risk Awareness', 'MOC Training', 'PSSR / Startup Readiness', 'Security / General Compliance', 'Other'];
const trainingTypes = ['Awareness', 'Classroom Training', 'Practical Training', 'Field Demonstration', 'Toolbox Talk', 'E-Learning', 'SOP Training', 'Procedure Acknowledgement', 'Permit Role Training', 'Emergency Drill', 'Refresher Training', 'Vendor / External Training', 'Competency Assessment Prep', 'Certification Preparation', 'Custom'];
const deliveryMethods = ['Classroom', 'Field demonstration', 'Toolbox talk', 'E-Learning', 'External vendor', 'Supervisor briefing', 'Document acknowledgement', 'Emergency drill', 'Blended', 'Other'];
const evidenceTypes = ['Training attendance record', 'Certificate', 'Assessment score', 'Quiz pass', 'SOP acknowledgement', 'Practical assessment', 'Supervisor sign-off', 'HSE approval', 'External document', 'LMS import', 'Manual verification', 'Document Control evidence', 'Other'];
const linkTypes = ['Competency Profile / Requirement', 'Matrix Rule', 'SOP', 'PSI Chemical / SDS', 'PSI Process Chemistry', 'Safe Operating Limit', 'Safeguard / Control', 'Electrical Classification', 'Material Compatibility', 'PTW Role', 'MOC', 'PSSR', 'HAZOP recommendation', 'Incident lesson', 'Audit finding', 'Equipment', 'Document Control'];
const statuses = ['Draft', 'Active', 'Approved Current', 'Pending Review', 'Review Overdue', 'Superseded', 'Archived'];
const reviewStatuses = ['Draft', 'Pending Review', 'Returned', 'Rejected', 'Approved Current', 'Review Overdue', 'Superseded', 'Archived'];
const syncStatuses = ['Not Linked', 'Linked', 'Sync Required', 'In Sync', 'Out of Sync', 'Pending Review', 'Failed', 'Not Applicable'];
const documentStatuses = ['No Document Required', 'Current Approved', 'Missing Required Document', 'Pending Approval', 'Superseded', 'Expired', 'Rejected', 'Needs Review'];
const versionTypes = ['Initial', 'Minor edit', 'Major revision', 'SOP-driven update', 'PSI-driven update', 'MOC-driven update', 'Incident-driven update', 'HAZOP-driven update', 'Regulatory reapproval'];

@Injectable()
export class TrainingRequiredLibraryService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [summary, registry, byCategory, byStatus, reviewOverduePreview, matrixUnlinkedPreview, settings] = await Promise.all([
      this.dashboardSummary(user, query),
      this.library(user, { ...query, limit: query.limit ?? 10 }),
      this.dashboardByCategory(user, query),
      this.dashboardByStatus(user, query),
      this.reviewOverduePreview(user, { ...query, limit: 8 }),
      this.matrixUnlinkedPreview(user, { ...query, limit: 8 }),
      this.settings(user, query)
    ]);
    const rows = registry.allRows ?? registry.rows;
    return {
      header: {
        title: 'Required Training Library',
        subtitle: 'Controlled training catalog for matrix rules, competency profiles, evidence policy, document links, and recurrence basis.',
        selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
        lastUpdated: new Date().toISOString()
      },
      summary,
      byCategory,
      byStatus,
      safetyCriticalPreview: rows.filter((row: Row) => row.safety_critical).slice(0, 8),
      ptwCriticalPreview: rows.filter((row: Row) => row.ptw_critical).slice(0, 8),
      psmCriticalPreview: rows.filter((row: Row) => row.psm_critical).slice(0, 8),
      reviewOverduePreview,
      pendingApprovalPreview: rows.filter((row: Row) => row.review_status === 'Pending Review').slice(0, 8),
      matrixUnlinkedPreview,
      documentGaps: rows.filter((row: Row) => ['Missing Required Document', 'Expired', 'Rejected', 'Needs Review'].includes(row.document_status)).slice(0, 8),
      recentlyUpdated: rows.slice(0, 8),
      reapprovalRequired: rows.filter((row: Row) => row.readiness_blockers_json?.some?.((blocker: Row) => blocker.code === 'VERSION_UPDATE_REQUIRED')).slice(0, 8),
      registry,
      settings
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const rows = await this.scopedItems(user, query);
    const today = this.dateOnly(new Date());
    return {
      totalTrainingItems: rows.length,
      activeTrainingItems: rows.filter((row) => row.status === 'Active').length,
      draftTrainingItems: rows.filter((row) => row.status === 'Draft').length,
      approvedCurrent: rows.filter((row) => row.status === 'Approved Current' || row.review_status === 'Approved Current').length,
      pendingApproval: rows.filter((row) => row.review_status === 'Pending Review').length,
      reviewOverdue: rows.filter((row) => row.next_review_date && row.next_review_date < today).length,
      superseded: rows.filter((row) => row.status === 'Superseded').length,
      archived: rows.filter((row) => row.status === 'Archived' || row.archived_at).length,
      safetyCritical: rows.filter((row) => row.safety_critical).length,
      psmCritical: rows.filter((row) => row.psm_critical).length,
      ptwCritical: rows.filter((row) => row.ptw_critical).length,
      mocCritical: rows.filter((row) => row.moc_critical).length,
      pssrCritical: rows.filter((row) => row.pssr_critical).length,
      matrixLinked: rows.filter((row) => row.matrix_sync_status !== 'Not Linked').length,
      competencyLinked: rows.filter((row) => row.competency_sync_status !== 'Not Linked').length,
      temporaryMatrixRefs: rows.filter((row) => row.matrix_sync_status === 'Sync Required').length,
      missingEvidencePolicy: rows.filter((row) => row.evidence_policy_status === 'Missing Evidence Policy').length,
      missingApprovedDocuments: rows.filter((row) => row.document_status === 'Missing Required Document').length,
      missingOwner: rows.filter((row) => !row.owner_user_id && !row.owner_role).length,
      versionUpdateRequired: rows.filter((row) => row.readiness_blockers_json?.some?.((blocker: Row) => blocker.code === 'VERSION_UPDATE_REQUIRED')).length
    };
  }

  async dashboardByCategory(user: RequestUser, query: Row = {}) {
    return this.countBy(await this.scopedItems(user, query), 'training_category');
  }

  async dashboardByStatus(user: RequestUser, query: Row = {}) {
    return this.countBy(await this.scopedItems(user, query), 'status');
  }

  async reviewOverduePreview(user: RequestUser, query: Row = {}) {
    const today = this.dateOnly(new Date());
    return (await this.scopedItems(user, query)).filter((row) => row.next_review_date && row.next_review_date < today).slice(0, Number(query.limit ?? 25));
  }

  async matrixUnlinkedPreview(user: RequestUser, query: Row = {}) {
    return (await this.scopedItems(user, query)).filter((row) => row.matrix_sync_status === 'Not Linked' || row.matrix_sync_status === 'Sync Required').slice(0, Number(query.limit ?? 25));
  }

  async library(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = await this.scopedItems(user, query);
    const filtered = this.applyFilters(allRows, query);
    const sorted = this.sortRows(filtered, String(query.sort ?? 'updated_at.desc'));
    return {
      rows: sorted.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: filtered.length,
      allRows: sorted,
      summary: this.registrySummary(filtered),
      savedViews: ['All Training', 'Active', 'Draft', 'Pending Approval', 'Review Overdue', 'Safety-Critical', 'PSM-Critical', 'PTW-Critical', 'Matrix Unlinked', 'Missing Evidence Policy', 'Missing Approved Documents'],
      lastUpdated: new Date().toISOString()
    };
  }

  async librarySummary(user: RequestUser, query: Row = {}) {
    return this.registrySummary(this.applyFilters(await this.scopedItems(user, query), query));
  }

  async detail(user: RequestUser, trainingId: string) {
    const item = await this.assertItem(user, trainingId);
    await this.refreshItemStatus(user, item.id).catch(() => null);
    const [content, deliveryRules, evidenceRules, applicability, links, documents, matrixLinks, competencyLinks, versionHistory, reviewRecords, history, settings] = await Promise.all([
      this.content(user, trainingId),
      this.deliveryRules(user, trainingId),
      this.evidenceRules(user, trainingId),
      this.applicability(user, trainingId),
      this.links(user, trainingId),
      this.documents(user, trainingId),
      this.matrixLinks(user, trainingId),
      this.competencyLinks(user, trainingId),
      this.versionHistory(user, trainingId),
      this.reviewRecords(user, trainingId),
      this.history(user, { trainingId, limit: 25 }),
      this.settings(user, { siteId: item.site_id })
    ]);
    const current = await this.assertItem(user, trainingId);
    return {
      item: current,
      header: { title: current.training_title, code: current.training_code, status: current.status, reviewStatus: current.review_status, version: current.version, owner: current.owner_user_id ?? current.owner_role, readinessStatus: current.readiness_status },
      summary: this.itemSummary(current, content, documents, matrixLinks, competencyLinks),
      content,
      deliveryRules,
      evidenceRules,
      applicability,
      links,
      documents,
      matrixLinks,
      competencyLinks,
      versionHistory,
      reviewRecords,
      history: history.rows,
      readiness: this.readinessFor(current),
      settings,
      tabs: this.detailTabs(trainingId)
    };
  }

  async createItem(user: RequestUser, dto: Row) {
    this.requireText(dto.trainingTitle ?? dto.training_title ?? dto.title, 'Training title is required.');
    this.requireText(dto.trainingCode ?? dto.training_code ?? dto.code, 'Training code is required.');
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const id = randomUUID();
    const payload = this.itemPayload(user, dto, id, true);
    const inserted = this.must(await this.db.single<Row>(this.db.from('training_required_items').insert(payload).select().single()), 'Required training item was not returned by the database.');
    await Promise.all([
      this.upsertDelivery(user, id, dto.deliveryRules ?? dto.delivery_rules ?? {}),
      this.upsertEvidence(user, id, dto.evidenceRules ?? dto.evidence_rules ?? {})
    ]);
    for (const section of dto.contentSections ?? dto.content_sections ?? []) await this.addContentSection(user, id, section, false);
    for (const scope of dto.scopes ?? dto.applicability ?? []) await this.addApplicability(user, id, scope, false);
    await this.createVersion(user, inserted, 'Initial', dto.changeReason ?? 'Initial required training library item created.');
    await this.writeEvent(user, inserted, 'Created', 'Required training created', null, inserted, dto.changeReason);
    return this.detail(user, id);
  }

  async updateItem(user: RequestUser, trainingId: string, dto: Row) {
    const before = await this.assertItem(user, trainingId);
    this.assertEditable(before, dto.changeReason ?? dto.controlledEditReason);
    const patch = this.itemPayload(user, dto, trainingId, false);
    const updated = this.must(await this.db.single<Row>(this.db.from('training_required_items').update(patch).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Updated required training item was not returned by the database.');
    await this.refreshItemStatus(user, trainingId);
    await this.writeEvent(user, updated, 'Updated', 'Required training updated', before, updated, dto.changeReason);
    return this.detail(user, trainingId);
  }

  async archive(user: RequestUser, trainingId: string, dto: Row) {
    this.requireText(dto.reason, 'Archive reason is required.');
    const before = await this.assertItem(user, trainingId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ status: 'Archived', review_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Archived required training item was not returned by the database.');
    await this.writeEvent(user, row, 'Archived', 'Required training archived', before, row, dto.reason);
    return this.detail(user, trainingId);
  }

  async reactivate(user: RequestUser, trainingId: string, dto: Row = {}) {
    const before = await this.assertItem(user, trainingId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ status: 'Draft', review_status: 'Draft', archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Reactivated required training item was not returned by the database.');
    await this.refreshItemStatus(user, trainingId);
    await this.writeEvent(user, row, 'Restored', 'Required training reactivated', before, row, dto.reason);
    return this.detail(user, trainingId);
  }

  async activate(user: RequestUser, trainingId: string) {
    const before = await this.assertItem(user, trainingId);
    const readiness = this.readinessFor(before);
    if (readiness.status === 'Blocked') throw new BadRequestException(`Activation blocked: ${readiness.blockers.map((b) => b.message).join('; ')}`);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ status: 'Active', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Activated required training item was not returned by the database.');
    await this.writeEvent(user, row, 'Activated', 'Required training activated', before, row);
    return this.detail(user, trainingId);
  }

  async newVersion(user: RequestUser, trainingId: string, dto: Row) {
    this.requireText(dto.reason ?? dto.changeReason, 'New version reason is required.');
    const before = await this.assertItem(user, trainingId);
    const nextNumber = Number(before.version_number ?? 1) + 1;
    const version = dto.version ?? `${nextNumber}.0`;
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ version, version_number: nextNumber, status: 'Draft', review_status: 'Draft', matrix_sync_status: 'Sync Required', competency_sync_status: 'Sync Required', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Required training new version was not returned by the database.');
    await this.createVersion(user, row, dto.versionType ?? 'Major revision', dto.reason ?? dto.changeReason);
    await this.writeEvent(user, row, 'Version Created', 'Required training new version created', before, row, dto.reason ?? dto.changeReason);
    return this.detail(user, trainingId);
  }

  async content(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_content_sections').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('section_order'));
  }

  async addContentSection(user: RequestUser, trainingId: string, dto: Row, write = true) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    this.requireText(dto.sectionTitle ?? dto.section_title ?? dto.title, 'Content section title is required.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_content_sections').insert(this.contentPayload(user, item, dto)).select().single()), 'Content section was not returned by the database.');
    if (write) await this.writeEvent(user, item, 'Content Updated', 'Required training content section added', null, row);
    await this.refreshItemStatus(user, trainingId);
    return row;
  }

  async updateContentSection(user: RequestUser, trainingId: string, sectionId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    const before = await this.assertChild(user, 'training_required_item_content_sections', trainingId, sectionId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_content_sections').update(this.compact({ section_order: dto.sectionOrder ?? dto.section_order, section_title: dto.sectionTitle ?? dto.section_title, summary: dto.summary, learning_outcome: dto.learningOutcome ?? dto.learning_outcome, linked_sop_id: dto.linkedSopId ?? dto.linked_sop_id, linked_psi_module: dto.linkedPsiModule ?? dto.linked_psi_module, linked_hazard: dto.linkedHazard ?? dto.linked_hazard, required: dto.required, duration_minutes: dto.durationMinutes ?? dto.duration_minutes, updated_by: user.id, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('required_training_id', trainingId).eq('id', sectionId).select().single()), 'Updated content section was not returned by the database.');
    await this.writeEvent(user, item, 'Content Updated', 'Required training content section updated', before, row, dto.changeReason);
    return row;
  }

  async deleteContentSection(user: RequestUser, trainingId: string, sectionId: string, dto: Row = {}) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.reason);
    const before = await this.assertChild(user, 'training_required_item_content_sections', trainingId, sectionId);
    await this.db.single(this.db.from('training_required_item_content_sections').delete().eq('company_id', user.tenantId).eq('required_training_id', trainingId).eq('id', sectionId).select('id').single());
    await this.writeEvent(user, item, 'Content Updated', 'Required training content section removed', before, null, dto.reason);
    await this.refreshItemStatus(user, trainingId);
    return { id: sectionId, deleted: true };
  }

  async deliveryRules(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.db.single<Row>(this.db.from('training_required_item_delivery_rules').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).maybeSingle()).catch(() => null);
  }

  async patchDeliveryRules(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    const before = await this.deliveryRules(user, trainingId);
    const row = await this.upsertDelivery(user, trainingId, dto);
    await this.writeEvent(user, item, 'Delivery Updated', 'Required training delivery/frequency rules updated', before, row, dto.changeReason);
    await this.refreshItemStatus(user, trainingId);
    return row;
  }

  async evidenceRules(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.db.single<Row>(this.db.from('training_required_item_evidence_rules').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).maybeSingle()).catch(() => null);
  }

  async patchEvidenceRules(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    const before = await this.evidenceRules(user, trainingId);
    const row = await this.upsertEvidence(user, trainingId, dto);
    await this.writeEvent(user, item, 'Evidence Updated', 'Required training evidence/verification rules updated', before, row, dto.changeReason);
    await this.refreshItemStatus(user, trainingId);
    return row;
  }

  async applicability(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_scopes').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('created_at'));
  }

  async addApplicability(user: RequestUser, trainingId: string, dto: Row, write = true) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    const siteId = dto.siteScopeId ?? dto.site_scope_id ?? dto.siteId ?? dto.site_id ?? item.site_id ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_scopes').insert(this.scopePayload(user, item, dto)).select().single()), 'Applicability scope was not returned by the database.');
    if (write) await this.writeEvent(user, item, 'Scope Updated', 'Required training applicability scope added', null, row);
    await this.refreshItemStatus(user, trainingId);
    return row;
  }

  async updateApplicability(user: RequestUser, trainingId: string, scopeId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    const before = await this.assertChild(user, 'training_required_item_scopes', trainingId, scopeId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_scopes').update(this.scopePatch(user, dto)).eq('company_id', user.tenantId).eq('required_training_id', trainingId).eq('id', scopeId).select().single()), 'Updated applicability scope was not returned by the database.');
    await this.writeEvent(user, item, 'Scope Updated', 'Required training applicability scope updated', before, row, dto.changeReason);
    await this.refreshItemStatus(user, trainingId);
    return row;
  }

  async deleteApplicability(user: RequestUser, trainingId: string, scopeId: string, dto: Row = {}) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.reason);
    const before = await this.assertChild(user, 'training_required_item_scopes', trainingId, scopeId);
    await this.db.single(this.db.from('training_required_item_scopes').delete().eq('company_id', user.tenantId).eq('required_training_id', trainingId).eq('id', scopeId).select('id').single());
    await this.writeEvent(user, item, 'Scope Updated', 'Required training applicability scope removed', before, null, dto.reason);
    return { id: scopeId, deleted: true };
  }

  async links(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_links').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('created_at', { ascending: false }));
  }

  async addLink(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    this.requireText(dto.linkedModule ?? dto.linked_module ?? dto.linkType ?? dto.link_type, 'Linked module/type is required.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_links').insert({ id: randomUUID(), company_id: user.tenantId, site_id: item.site_id, required_training_id: trainingId, link_type: dto.linkType ?? dto.link_type ?? dto.linkedModule ?? dto.linked_module, linked_module: dto.linkedModule ?? dto.linked_module ?? dto.linkType ?? dto.link_type, linked_record_id: dto.linkedRecordId ?? dto.linked_record_id ?? null, linked_record_number: dto.linkedRecordNumber ?? dto.linked_record_number ?? null, linked_record_title: dto.linkedRecordTitle ?? dto.linked_record_title ?? null, link_reason: dto.linkReason ?? dto.link_reason ?? null, snapshot_json: dto.snapshotJson ?? dto.snapshot_json ?? {}, created_by: user.id }).select().single()), 'Required training link was not returned by the database.');
    await this.writeEvent(user, item, 'Linked', 'Required training linked record added', null, row, dto.linkReason);
    return row;
  }

  async removeLink(user: RequestUser, trainingId: string, linkId: string, dto: Row = {}) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.reason);
    const before = await this.assertChild(user, 'training_required_item_links', trainingId, linkId);
    await this.db.single(this.db.from('training_required_item_links').delete().eq('company_id', user.tenantId).eq('required_training_id', trainingId).eq('id', linkId).select('id').single());
    await this.writeEvent(user, item, 'Unlinked', 'Required training linked record removed', before, null, dto.reason);
    return { id: linkId, deleted: true };
  }

  async documents(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_documents').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('created_at', { ascending: false }));
  }

  async linkDocument(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    this.requireText(dto.documentTitle ?? dto.document_title ?? dto.title, 'Document title is required.');
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_documents').insert({ id: randomUUID(), company_id: user.tenantId, site_id: item.site_id, required_training_id: trainingId, document_id: dto.documentId ?? dto.document_id ?? null, document_number: dto.documentNumber ?? dto.document_number ?? null, document_title: dto.documentTitle ?? dto.document_title ?? dto.title, document_type: dto.documentType ?? dto.document_type ?? null, document_status: dto.documentStatus ?? dto.document_status ?? 'Linked', revision: dto.revision ?? null, controlled: dto.controlled ?? true, required_document: Boolean(dto.requiredDocument ?? dto.required_document), snapshot_json: dto.snapshotJson ?? dto.snapshot_json ?? {}, created_by: user.id }).select().single()), 'Linked document was not returned by the database.');
    await this.writeEvent(user, item, 'Document Linked', 'Required training controlled document linked', null, row);
    await this.refreshItemStatus(user, trainingId);
    return row;
  }

  async removeDocument(user: RequestUser, trainingId: string, documentLinkId: string, dto: Row = {}) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.reason);
    const before = await this.assertChild(user, 'training_required_item_documents', trainingId, documentLinkId);
    await this.db.single(this.db.from('training_required_item_documents').delete().eq('company_id', user.tenantId).eq('required_training_id', trainingId).eq('id', documentLinkId).select('id').single());
    await this.writeEvent(user, item, 'Document Unlinked', 'Required training controlled document removed', before, null, dto.reason);
    await this.refreshItemStatus(user, trainingId);
    return { id: documentLinkId, deleted: true };
  }

  async matrixLinks(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_matrix_links').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('created_at', { ascending: false }));
  }

  async addMatrixLink(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    const rule = dto.matrixRuleId ?? dto.matrix_rule_id ? await this.db.single<Row>(this.db.from('training_matrix_rules').select('*').eq('company_id', user.tenantId).eq('id', dto.matrixRuleId ?? dto.matrix_rule_id).maybeSingle()).catch(() => null) : null;
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_matrix_links').insert({ id: randomUUID(), company_id: user.tenantId, site_id: item.site_id, required_training_id: trainingId, matrix_rule_id: rule?.id ?? null, matrix_rule_code: rule?.rule_code ?? dto.matrixRuleCode ?? dto.matrix_rule_code ?? null, matrix_rule_title: rule?.rule_title ?? dto.matrixRuleTitle ?? dto.matrix_rule_title ?? null, link_status: 'Linked', sync_status: 'Sync Required', impact_json: dto.impactJson ?? dto.impact_json ?? {}, created_by: user.id }).select().single()), 'Matrix link was not returned by the database.');
    await this.updateItemSyncStatus(user, trainingId, { matrix_sync_status: 'Linked' });
    await this.writeEvent(user, item, 'Matrix Linked', 'Required training linked to matrix rule', null, row);
    return row;
  }

  async previewMatrixImpact(user: RequestUser, trainingId: string) {
    const item = await this.assertItem(user, trainingId);
    const scopes = await this.applicability(user, trainingId);
    const existingLinks = await this.matrixLinks(user, trainingId);
    return { itemId: trainingId, trainingCode: item.training_code, trainingTitle: item.training_title, scopedRules: existingLinks.length, applicabilityScopes: scopes.length, canSync: item.status !== 'Archived', blockers: this.readinessFor(item).blockers.filter((b) => b.severity === 'Blocker') };
  }

  async syncToMatrix(user: RequestUser, trainingId: string) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, 'Sync required training to matrix.');
    const links = await this.matrixLinks(user, trainingId);
    if (!links.length) await this.addMatrixLink(user, trainingId, { matrixRuleTitle: item.training_title, matrixRuleCode: item.training_code });
    const row = await this.updateItemSyncStatus(user, trainingId, { matrix_sync_status: 'In Sync' });
    await this.writeEvent(user, row, 'Matrix Synced', 'Required training synced to training matrix', item, row);
    return { item: row, links: await this.matrixLinks(user, trainingId), status: 'In Sync' };
  }

  async matrixUnlinked(user: RequestUser, query: Row = {}) {
    return this.library(user, { ...query, matrixSyncStatus: query.matrixSyncStatus ?? 'Not Linked' });
  }

  async linkTemporaryMatrixReference(user: RequestUser, dto: Row) {
    const trainingId = dto.trainingId ?? dto.requiredTrainingId ?? dto.required_training_id;
    if (!trainingId) throw new BadRequestException('Required training ID is required.');
    return this.addMatrixLink(user, trainingId, dto);
  }

  async competencyLinks(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_competency_links').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('created_at', { ascending: false }));
  }

  async addCompetencyLink(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    this.assertEditable(item, dto.changeReason);
    const profileId = dto.competencyProfileId ?? dto.competency_profile_id ?? null;
    const requirementId = dto.competencyRequirementId ?? dto.competency_requirement_id ?? null;
    const requirement = requirementId ? await this.db.single<Row>(this.db.from('training_competency_requirements').select('*').eq('company_id', user.tenantId).eq('id', requirementId).maybeSingle()).catch(() => null) : null;
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_competency_links').insert({ id: randomUUID(), company_id: user.tenantId, site_id: item.site_id, required_training_id: trainingId, competency_profile_id: profileId, competency_requirement_id: requirementId, competency_code: requirement?.competency_code ?? dto.competencyCode ?? dto.competency_code ?? item.training_code, competency_title: requirement?.competency_title ?? dto.competencyTitle ?? dto.competency_title ?? item.training_title, link_status: 'Linked', sync_status: 'Sync Required', created_by: user.id }).select().single()), 'Competency link was not returned by the database.');
    await this.updateItemSyncStatus(user, trainingId, { competency_sync_status: 'Linked' });
    await this.writeEvent(user, item, 'Competency Linked', 'Required training linked to competency profile/requirement', null, row);
    return row;
  }

  async syncToCompetencyProfiles(user: RequestUser, trainingId: string) {
    const item = await this.assertItem(user, trainingId);
    const links = await this.competencyLinks(user, trainingId);
    if (!links.length) throw new BadRequestException('Add at least one competency link before syncing.');
    const row = await this.updateItemSyncStatus(user, trainingId, { competency_sync_status: 'In Sync' });
    await this.writeEvent(user, row, 'Competency Synced', 'Required training synced to competency profiles', item, row);
    return { item: row, links: await this.competencyLinks(user, trainingId), status: 'In Sync' };
  }

  async submitReview(user: RequestUser, trainingId: string, dto: Row = {}) {
    const before = await this.assertItem(user, trainingId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ review_status: 'Pending Review', status: before.status === 'Draft' ? 'Pending Review' : before.status, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Review submission was not returned by the database.');
    await this.db.single(this.db.from('training_required_item_review_records').insert({ id: randomUUID(), company_id: user.tenantId, site_id: row.site_id, required_training_id: trainingId, review_type: dto.reviewType ?? 'Approval', review_status: 'Pending Review', reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? row.reviewer_user_id ?? null, requested_by: user.id, comments: dto.comments ?? null, snapshot_json: row }).select('id').single()).catch(() => null);
    await this.writeEvent(user, row, 'Submitted', 'Required training submitted for review', before, row, dto.reason ?? dto.comments);
    return this.detail(user, trainingId);
  }

  async approve(user: RequestUser, trainingId: string, dto: Row = {}) {
    const before = await this.assertItem(user, trainingId);
    const readiness = this.readinessFor(before);
    if (readiness.status === 'Blocked' && !dto.overrideReason) throw new BadRequestException(`Approval blocked: ${readiness.blockers.map((b) => b.message).join('; ')}`);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ status: 'Approved Current', review_status: 'Approved Current', approved_by: user.id, approved_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Approval was not returned by the database.');
    await this.createVersion(user, row, dto.versionType ?? 'Minor edit', dto.reason ?? 'Required training approved.');
    await this.db.single(this.db.from('training_required_item_review_records').insert({ id: randomUUID(), company_id: user.tenantId, site_id: row.site_id, required_training_id: trainingId, review_type: 'Approval', review_status: 'Approved Current', reviewer_user_id: user.id, requested_by: before.updated_by ?? before.created_by, decision_by: user.id, decision_at: new Date().toISOString(), decision_reason: dto.reason ?? null, comments: dto.comments ?? null, snapshot_json: row }).select('id').single()).catch(() => null);
    await this.writeEvent(user, row, 'Approved', 'Required training approved/current', before, row, dto.reason);
    return this.detail(user, trainingId);
  }

  async versionHistory(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_versions').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('version_number', { ascending: false }));
  }

  async reviewRecords(user: RequestUser, trainingId: string) {
    await this.assertItem(user, trainingId);
    return this.safeMany<Row>(this.db.from('training_required_item_review_records').select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).order('requested_at', { ascending: false }));
  }

  async history(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let req: any = this.siteScopedBase(user, this.db.from('training_required_item_history_events').select('*').eq('company_id', user.tenantId), 'site_id', true);
    if (query.trainingId) req = req.eq('required_training_id', query.trainingId);
    if (query.eventType) req = req.eq('event_type', query.eventType);
    if (query.search) req = req.or(`event_title.ilike.%${query.search}%,event_description.ilike.%${query.search}%`);
    const rows = await this.safeMany<Row>(req.order('created_at', { ascending: false }));
    return { rows: rows.slice((page - 1) * limit, page * limit), page, limit, total: rows.length };
  }

  async exportLibrary(user: RequestUser, query: Row = {}) {
    const rows = (await this.library(user, { ...query, limit: 100 })).allRows;
    await this.writeEvent(user, rows[0] ?? { company_id: user.tenantId, site_id: user.selectedSiteId ?? user.activeSiteId ?? null, id: null }, 'Exported', 'Required training library exported', null, { count: rows.length, query });
    return { format: query.format ?? 'json', generatedAt: new Date().toISOString(), rows };
  }

  async importTemplate(user: RequestUser) {
    await this.writeEvent(user, { company_id: user.tenantId, site_id: user.selectedSiteId ?? user.activeSiteId ?? null, id: null }, 'Exported', 'Required training import template requested', null, { columns: ['training_code', 'training_title', 'training_category', 'training_type', 'owner_role', 'evidence_required'] });
    return { columns: ['training_code', 'training_title', 'training_category', 'training_type', 'description', 'objective', 'target_audience', 'owner_role', 'reviewer_user_id', 'effective_date', 'next_review_date', 'safety_critical', 'psm_critical', 'ptw_critical', 'moc_critical', 'pssr_critical', 'delivery_method', 'recurrence_interval_days', 'evidence_required', 'primary_evidence_type', 'document_required'] };
  }

  async importJob(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_import_jobs').insert({ id: randomUUID(), company_id: user.tenantId, site_id: siteId, import_status: 'Queued', source_file_name: dto.sourceFileName ?? dto.source_file_name ?? null, total_rows: Number(dto.totalRows ?? dto.total_rows ?? 0), created_by: user.id }).select().single()), 'Import job was not returned by the database.');
    await this.writeEvent(user, { company_id: user.tenantId, site_id: siteId, id: null }, 'Imported', 'Required training import job queued', null, row);
    return row;
  }

  async settings(user: RequestUser, query: Row = {}) {
    const siteId = query.siteId ?? query.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const existing = await this.db.single<Row>(this.db.from('training_required_item_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId).maybeSingle()).catch(() => null);
    if (existing) return existing;
    return { company_id: user.tenantId, site_id: siteId, owner_required: true, reviewer_required: false, evidence_policy_required: true, approved_document_required_for_safety_critical: true, matrix_link_required_for_active: false, competency_link_required_for_safety_critical: false, review_interval_days: 365, controlled_edit_requires_new_version: true, import_requires_review: true, settings_json: {} };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const existing = await this.settings(user, { siteId });
    const payload = this.compact({ id: existing.id ?? randomUUID(), company_id: user.tenantId, site_id: siteId, owner_required: dto.ownerRequired ?? dto.owner_required, reviewer_required: dto.reviewerRequired ?? dto.reviewer_required, evidence_policy_required: dto.evidencePolicyRequired ?? dto.evidence_policy_required, approved_document_required_for_safety_critical: dto.approvedDocumentRequiredForSafetyCritical ?? dto.approved_document_required_for_safety_critical, matrix_link_required_for_active: dto.matrixLinkRequiredForActive ?? dto.matrix_link_required_for_active, competency_link_required_for_safety_critical: dto.competencyLinkRequiredForSafetyCritical ?? dto.competency_link_required_for_safety_critical, review_interval_days: dto.reviewIntervalDays ?? dto.review_interval_days, controlled_edit_requires_new_version: dto.controlledEditRequiresNewVersion ?? dto.controlled_edit_requires_new_version, import_requires_review: dto.importRequiresReview ?? dto.import_requires_review, settings_json: dto.settingsJson ?? dto.settings_json, updated_by: user.id, updated_at: new Date().toISOString() });
    const row = this.must(await this.db.single<Row>(this.db.from('training_required_item_settings').upsert(payload, { onConflict: 'company_id,site_id' }).select().single()), 'Settings were not returned by the database.');
    await this.writeEvent(user, { company_id: user.tenantId, site_id: siteId, id: null }, 'Settings Updated', 'Required training settings updated', existing, row);
    return row;
  }

  async context(user: RequestUser, query: Row = {}) {
    const scope = this.scope(user);
    const [sites, units, areas, users, documents, matrixRules, competencyProfiles, settings] = await Promise.all([
      this.safeMany<Row>(this.db.from('Site').select('id,name,code').eq('tenantId', user.tenantId)),
      this.safeMany<Row>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', user.tenantId)),
      this.safeMany<Row>(this.db.from('Area').select('id,name,code,siteId,unitId').eq('tenantId', user.tenantId)),
      this.safeMany<Row>(this.db.from('User').select('id,email,displayName,title,department,status').eq('tenantId', user.tenantId).order('displayName')),
      this.safeMany<Row>(this.db.from('Document').select('id,title,number,status,revision,siteId').eq('tenantId', user.tenantId).limit(50)),
      this.safeMany<Row>(this.siteScopedBase(user, this.db.from('training_matrix_rules').select('id,rule_code,rule_title,training_code,training_title,site_id,rule_status').eq('company_id', user.tenantId), 'site_id', true).limit(50)),
      this.safeMany<Row>(this.siteScopedBase(user, this.db.from('training_competency_profiles').select('id,profile_code,profile_title,profile_type,site_id,profile_status').eq('company_id', user.tenantId), 'site_id', true).limit(50)),
      this.settings(user, query)
    ]);
    return { sites, units, areas, users, documents, matrixRules, competencyProfiles, allowedSiteIds: scope.allowedSiteIds, selectedSiteId: scope.selectedSiteId, lookups: this.lookupPayload(), settings };
  }

  async lookups() {
    return this.lookupPayload();
  }

  private async scopedItems(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_required_items').select('*').eq('company_id', user.tenantId);
    if (query.siteId) req = req.eq('site_id', this.assertSiteAccess(user, query.siteId));
    else req = this.siteScopedBase(user, req, 'site_id', true);
    return this.safeMany<Row>(req.order('updated_at', { ascending: false }));
  }

  private applyFilters(rows: Row[], query: Row) {
    let result = rows;
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) result = result.filter((row) => [row.training_title, row.training_code, row.description, row.objective, row.target_audience].some((value) => String(value ?? '').toLowerCase().includes(search)));
    if (query.status) result = result.filter((row) => row.status === query.status);
    if (query.reviewStatus) result = result.filter((row) => row.review_status === query.reviewStatus);
    if (query.category) result = result.filter((row) => row.training_category === query.category);
    if (query.trainingType) result = result.filter((row) => row.training_type === query.trainingType);
    if (query.matrixSyncStatus) result = result.filter((row) => row.matrix_sync_status === query.matrixSyncStatus);
    if (query.competencySyncStatus) result = result.filter((row) => row.competency_sync_status === query.competencySyncStatus);
    if (query.safetyCritical === 'true') result = result.filter((row) => row.safety_critical);
    if (query.psmCritical === 'true') result = result.filter((row) => row.psm_critical);
    if (query.ptwCritical === 'true') result = result.filter((row) => row.ptw_critical);
    if (query.mocCritical === 'true') result = result.filter((row) => row.moc_critical);
    if (query.pssrCritical === 'true') result = result.filter((row) => row.pssr_critical);
    if (query.reviewOverdue === 'true') {
      const today = this.dateOnly(new Date());
      result = result.filter((row) => row.next_review_date && row.next_review_date < today);
    }
    return result;
  }

  private registrySummary(rows: Row[]) {
    return {
      total: rows.length,
      active: rows.filter((row) => row.status === 'Active').length,
      draft: rows.filter((row) => row.status === 'Draft').length,
      approvedCurrent: rows.filter((row) => row.status === 'Approved Current' || row.review_status === 'Approved Current').length,
      pendingReview: rows.filter((row) => row.review_status === 'Pending Review').length,
      reviewOverdue: rows.filter((row) => row.review_status === 'Review Overdue' || (row.next_review_date && row.next_review_date < this.dateOnly(new Date()))).length,
      safetyCritical: rows.filter((row) => row.safety_critical).length,
      recurring: rows.filter((row) => row.recurrence_type === 'Recurring' || row.recurrence_interval_days).length,
      oneTime: rows.filter((row) => row.recurrence_type === 'One-Time' && !row.recurrence_interval_days).length,
      requiresCertificate: rows.filter((row) => row.evidence_policy_status?.includes('Certificate')).length,
      assessmentRequired: rows.filter((row) => row.evidence_policy_status?.includes('Assessment')).length,
      sopAckRequired: rows.filter((row) => row.evidence_policy_status?.includes('SOP')).length,
      supervisorSignoffRequired: rows.filter((row) => row.evidence_policy_status?.includes('Supervisor')).length,
      hseVerificationRequired: rows.filter((row) => row.evidence_policy_status?.includes('HSE')).length,
      missingEvidencePolicy: rows.filter((row) => row.evidence_policy_status === 'Missing Evidence Policy').length,
      missingApprovedDocuments: rows.filter((row) => row.document_status === 'Missing Required Document').length,
      matrixLinked: rows.filter((row) => row.matrix_sync_status !== 'Not Linked').length,
      competencyLinked: rows.filter((row) => row.competency_sync_status !== 'Not Linked').length
    };
  }

  private itemSummary(item: Row, content: Row[], documents: Row[], matrixLinks: Row[], competencyLinks: Row[]) {
    return {
      status: item.status,
      reviewStatus: item.review_status,
      evidencePolicyStatus: item.evidence_policy_status,
      documentStatus: item.document_status,
      matrixSyncStatus: item.matrix_sync_status,
      competencySyncStatus: item.competency_sync_status,
      contentSections: content.length,
      linkedDocuments: documents.length,
      requiredDocuments: documents.filter((doc) => doc.required_document).length,
      matrixLinks: matrixLinks.length,
      competencyLinks: competencyLinks.length,
      usageCount: item.usage_count ?? 0,
      readinessStatus: item.readiness_status
    };
  }

  private itemPayload(user: RequestUser, dto: Row, id: string, create: boolean) {
    const siteId = dto.siteId ?? dto.site_id ?? (create ? user.selectedSiteId ?? user.activeSiteId ?? null : undefined);
    if (siteId) this.assertSiteAccess(user, siteId);
    return this.compact({
      ...(create ? { id, company_id: user.tenantId } : {}),
      site_id: siteId,
      training_code: dto.trainingCode ?? dto.training_code ?? dto.code,
      training_title: dto.trainingTitle ?? dto.training_title ?? dto.title,
      training_category: dto.trainingCategory ?? dto.training_category,
      training_type: dto.trainingType ?? dto.training_type,
      description: dto.description,
      objective: dto.objective,
      target_audience: dto.targetAudience ?? dto.target_audience,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      owner_role: dto.ownerRole ?? dto.owner_role,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      version: dto.version,
      effective_date: dto.effectiveDate ?? dto.effective_date,
      next_review_date: dto.nextReviewDate ?? dto.next_review_date,
      status: dto.status,
      review_status: dto.reviewStatus ?? dto.review_status,
      criticality: dto.criticality,
      safety_critical: dto.safetyCritical ?? dto.safety_critical,
      psm_critical: dto.psmCritical ?? dto.psm_critical,
      ptw_critical: dto.ptwCritical ?? dto.ptw_critical,
      moc_critical: dto.mocCritical ?? dto.moc_critical,
      pssr_critical: dto.pssrCritical ?? dto.pssr_critical,
      recurrence_type: dto.recurrenceType ?? dto.recurrence_type,
      recurrence_interval_days: dto.recurrenceIntervalDays ?? dto.recurrence_interval_days,
      delivery_method: dto.deliveryMethod ?? dto.delivery_method,
      notes: dto.notes,
      metadata_json: dto.metadataJson ?? dto.metadata_json,
      created_by: create ? user.id : undefined,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
  }

  private contentPayload(user: RequestUser, item: Row, dto: Row) {
    return {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: item.site_id,
      required_training_id: item.id,
      section_order: Number(dto.sectionOrder ?? dto.section_order ?? 1),
      section_title: dto.sectionTitle ?? dto.section_title ?? dto.title,
      summary: dto.summary ?? null,
      learning_outcome: dto.learningOutcome ?? dto.learning_outcome ?? null,
      linked_sop_id: dto.linkedSopId ?? dto.linked_sop_id ?? null,
      linked_psi_module: dto.linkedPsiModule ?? dto.linked_psi_module ?? null,
      linked_hazard: dto.linkedHazard ?? dto.linked_hazard ?? null,
      required: dto.required ?? true,
      duration_minutes: dto.durationMinutes ?? dto.duration_minutes ?? null,
      created_by: user.id,
      updated_by: user.id
    };
  }

  private scopePayload(user: RequestUser, item: Row, dto: Row) {
    return {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: item.site_id,
      required_training_id: item.id,
      ...this.scopePatch(user, dto)
    };
  }

  private scopePatch(user: RequestUser, dto: Row) {
    const siteScopeId = dto.siteScopeId ?? dto.site_scope_id ?? dto.siteId ?? dto.site_id;
    if (siteScopeId) this.assertSiteAccess(user, siteScopeId);
    return this.compact({
      scope_type: dto.scopeType ?? dto.scope_type ?? 'Site',
      site_scope_id: siteScopeId,
      department_id: dto.departmentId ?? dto.department_id,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      equipment_id: dto.equipmentId ?? dto.equipment_id,
      worker_type_filter: dto.workerTypeFilter ?? dto.worker_type_filter,
      employer_type_filter: dto.employerTypeFilter ?? dto.employer_type_filter,
      contractor_company_filter: dto.contractorCompanyFilter ?? dto.contractor_company_filter,
      job_role_filter: dto.jobRoleFilter ?? dto.job_role_filter,
      competency_profile_id: dto.competencyProfileId ?? dto.competency_profile_id,
      ptw_role_filter: dto.ptwRoleFilter ?? dto.ptw_role_filter,
      sop_id: dto.sopId ?? dto.sop_id,
      psi_module: dto.psiModule ?? dto.psi_module,
      psi_record_id: dto.psiRecordId ?? dto.psi_record_id,
      moc_trigger_type: dto.mocTriggerType ?? dto.moc_trigger_type,
      pssr_trigger_type: dto.pssrTriggerType ?? dto.pssr_trigger_type,
      applicability_rule_json: dto.applicabilityRuleJson ?? dto.applicability_rule_json,
      notes: dto.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
  }

  private async upsertDelivery(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    const existing = await this.deliveryRules(user, trainingId);
    const payload = this.compact({
      id: existing?.id ?? randomUUID(),
      company_id: user.tenantId,
      site_id: item.site_id,
      required_training_id: trainingId,
      delivery_method: dto.deliveryMethod ?? dto.delivery_method ?? item.delivery_method,
      instructor_required: dto.instructorRequired ?? dto.instructor_required,
      self_paced_allowed: dto.selfPacedAllowed ?? dto.self_paced_allowed,
      external_provider_allowed: dto.externalProviderAllowed ?? dto.external_provider_allowed,
      initial_due_rule: dto.initialDueRule ?? dto.initial_due_rule,
      required_before_site_access: dto.requiredBeforeSiteAccess ?? dto.required_before_site_access,
      required_before_unit_access: dto.requiredBeforeUnitAccess ?? dto.required_before_unit_access,
      required_before_ptw_role: dto.requiredBeforePtwRole ?? dto.required_before_ptw_role,
      required_before_moc_implementation: dto.requiredBeforeMocImplementation ?? dto.required_before_moc_implementation,
      required_before_pssr_startup: dto.requiredBeforePssrStartup ?? dto.required_before_pssr_startup,
      one_time: dto.oneTime ?? dto.one_time,
      recurring: dto.recurring ?? dto.recurrenceType === 'Recurring',
      recurrence_interval_days: dto.recurrenceIntervalDays ?? dto.recurrence_interval_days,
      grace_period_days: dto.gracePeriodDays ?? dto.grace_period_days,
      expiry_warning_days: dto.expiryWarningDays ?? dto.expiry_warning_days,
      requalification_after_incident: dto.requalificationAfterIncident ?? dto.requalification_after_incident,
      requalification_after_sop_change: dto.requalificationAfterSopChange ?? dto.requalification_after_sop_change,
      requalification_after_psi_change: dto.requalificationAfterPsiChange ?? dto.requalification_after_psi_change,
      requalification_after_moc: dto.requalificationAfterMoc ?? dto.requalification_after_moc,
      notes: dto.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    return this.must(await this.db.single<Row>(this.db.from('training_required_item_delivery_rules').upsert(payload, { onConflict: 'id' }).select().single()), 'Delivery rules were not returned by the database.');
  }

  private async upsertEvidence(user: RequestUser, trainingId: string, dto: Row) {
    const item = await this.assertItem(user, trainingId);
    const existing = await this.evidenceRules(user, trainingId);
    const payload = this.compact({
      id: existing?.id ?? randomUUID(),
      company_id: user.tenantId,
      site_id: item.site_id,
      required_training_id: trainingId,
      evidence_required: dto.evidenceRequired ?? dto.evidence_required,
      accepted_evidence_types: dto.acceptedEvidenceTypes ?? dto.accepted_evidence_types,
      primary_evidence_type: dto.primaryEvidenceType ?? dto.primary_evidence_type,
      attendance_required: dto.attendanceRequired ?? dto.attendance_required,
      certificate_required: dto.certificateRequired ?? dto.certificate_required,
      assessment_required: dto.assessmentRequired ?? dto.assessment_required,
      minimum_score: dto.minimumScore ?? dto.minimum_score,
      sop_acknowledgement_required: dto.sopAcknowledgementRequired ?? dto.sop_acknowledgement_required,
      practical_demonstration_required: dto.practicalDemonstrationRequired ?? dto.practical_demonstration_required,
      supervisor_signoff_required: dto.supervisorSignoffRequired ?? dto.supervisor_signoff_required,
      hse_verification_required: dto.hseVerificationRequired ?? dto.hse_verification_required,
      external_certificate_allowed: dto.externalCertificateAllowed ?? dto.external_certificate_allowed,
      document_evidence_required: dto.documentEvidenceRequired ?? dto.document_evidence_required,
      verification_required: dto.verificationRequired ?? dto.verification_required,
      verification_role: dto.verificationRole ?? dto.verification_role,
      approval_required: dto.approvalRequired ?? dto.approval_required,
      e_signature_required: dto.eSignatureRequired ?? dto.e_signature_required,
      evidence_validity_days: dto.evidenceValidityDays ?? dto.evidence_validity_days,
      retake_required_on_fail: dto.retakeRequiredOnFail ?? dto.retake_required_on_fail,
      max_attempts: dto.maxAttempts ?? dto.max_attempts,
      notes: dto.notes,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
    return this.must(await this.db.single<Row>(this.db.from('training_required_item_evidence_rules').upsert(payload, { onConflict: 'id' }).select().single()), 'Evidence rules were not returned by the database.');
  }

  private async refreshItemStatus(user: RequestUser, trainingId: string) {
    const item = await this.assertItem(user, trainingId);
    const [evidence, documents, matrixLinks, competencyLinks] = await Promise.all([
      this.evidenceRules(user, trainingId),
      this.documents(user, trainingId),
      this.matrixLinks(user, trainingId),
      this.competencyLinks(user, trainingId)
    ]);
    const evidenceStatus = !evidence || (evidence.evidence_required && !evidence.primary_evidence_type && !evidence.accepted_evidence_types?.length) ? 'Missing Evidence Policy' : evidence.certificate_required ? 'Certificate Required' : evidence.assessment_required ? 'Assessment Required' : evidence.evidence_required ? 'Evidence Required' : 'No Evidence Required';
    const documentStatus = documents.some((doc) => doc.required_document && doc.document_status !== 'Current Approved') ? 'Missing Required Document' : documents.some((doc) => doc.document_status === 'Current Approved') ? 'Current Approved' : 'No Document Required';
    const readiness = this.readinessFor({ ...item, evidence_policy_status: evidenceStatus, document_status: documentStatus, matrix_sync_status: matrixLinks.length ? item.matrix_sync_status === 'Not Linked' ? 'Linked' : item.matrix_sync_status : 'Not Linked', competency_sync_status: competencyLinks.length ? item.competency_sync_status === 'Not Linked' ? 'Linked' : item.competency_sync_status : 'Not Linked' });
    return this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ evidence_policy_status: evidenceStatus, document_status: documentStatus, matrix_sync_status: matrixLinks.length ? item.matrix_sync_status === 'Not Linked' ? 'Linked' : item.matrix_sync_status : 'Not Linked', competency_sync_status: competencyLinks.length ? item.competency_sync_status === 'Not Linked' ? 'Linked' : item.competency_sync_status : 'Not Linked', readiness_status: readiness.status, readiness_blockers_json: readiness.blockers, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Refreshed required training item was not returned by the database.');
  }

  private readinessFor(item: Row) {
    const blockers: Row[] = [];
    if (!item.owner_user_id && !item.owner_role) blockers.push({ code: 'MISSING_OWNER', severity: 'Warning', message: 'Training owner is missing.' });
    if (item.evidence_policy_status === 'Missing Evidence Policy') blockers.push({ code: 'MISSING_EVIDENCE_POLICY', severity: 'Blocker', message: 'Evidence / verification policy is missing.' });
    if ((item.safety_critical || item.psm_critical || item.ptw_critical) && item.document_status === 'Missing Required Document') blockers.push({ code: 'MISSING_APPROVED_DOCUMENT', severity: 'Blocker', message: 'Critical training requires current approved document evidence.' });
    if (item.next_review_date && item.next_review_date < this.dateOnly(new Date())) blockers.push({ code: 'REVIEW_OVERDUE', severity: 'Blocker', message: 'Training review is overdue.' });
    if (item.status === 'Active' && item.matrix_sync_status === 'Not Linked') blockers.push({ code: 'MATRIX_NOT_LINKED', severity: 'Warning', message: 'Active training is not linked to a matrix rule.' });
    if ((item.safety_critical || item.ptw_critical) && item.competency_sync_status === 'Not Linked') blockers.push({ code: 'COMPETENCY_NOT_LINKED', severity: 'Warning', message: 'Critical training is not linked to a competency profile/requirement.' });
    return { status: blockers.some((b) => b.severity === 'Blocker') ? 'Blocked' : blockers.length ? 'Warning' : 'Complete', blockers };
  }

  private async createVersion(user: RequestUser, item: Row, versionType: string, reason: string) {
    return this.db.single(this.db.from('training_required_item_versions').insert({ id: randomUUID(), company_id: user.tenantId, site_id: item.site_id, required_training_id: item.id, version: item.version, version_number: item.version_number ?? 1, version_type: versionType, change_reason: reason, snapshot_json: item, created_by: user.id }).select('id').single()).catch(() => null);
  }

  private async updateItemSyncStatus(user: RequestUser, trainingId: string, patch: Row) {
    return this.must(await this.db.single<Row>(this.db.from('training_required_items').update({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', trainingId).select().single()), 'Required training sync status was not returned by the database.');
  }

  private async writeEvent(user: RequestUser, item: Row, type: string, title: string, before: JsonValue | null, after: JsonValue | null, reason?: string | null) {
    const auditLog = await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.required.${type.toLowerCase().replace(/\s+/g, '_')}`, entityType: 'training_required_item', entityId: item.id ?? undefined, before, after, metadata: { reason: reason ?? null } }).catch(() => null);
    return this.db.single(this.db.from('training_required_item_history_events').insert({ id: randomUUID(), company_id: user.tenantId, site_id: item.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null, required_training_id: item.id ?? null, event_type: type, event_title: title, event_description: reason ?? null, related_record_type: 'training_required_item', related_record_id: item.id ?? null, actor_user_id: user.id, reason: reason ?? null, before_values_json: before, after_values_json: after, audit_log_id: (auditLog as Row | null)?.id ?? null, correlation_id: randomUUID() }).select('id').single()).catch(() => null);
  }

  private async assertItem(user: RequestUser, trainingId: string) {
    const row = await this.db.single<Row>(this.db.from('training_required_items').select('*').eq('company_id', user.tenantId).eq('id', trainingId).maybeSingle()).catch(() => null);
    if (!row) throw new NotFoundException('Required training item was not found.');
    if (row.site_id) this.assertSiteAccess(user, row.site_id);
    return row;
  }

  private async assertChild(user: RequestUser, table: string, trainingId: string, id: string) {
    const row = await this.db.single<Row>(this.db.from(table).select('*').eq('company_id', user.tenantId).eq('required_training_id', trainingId).eq('id', id).maybeSingle()).catch(() => null);
    if (!row) throw new NotFoundException('Required training child record was not found.');
    return row;
  }

  private assertEditable(item: Row, reason?: string | null) {
    if (item.archived_at || item.status === 'Archived') throw new BadRequestException('Archived required training items must be reactivated before editing.');
    if (['Approved Current', 'Superseded'].includes(item.status) && !String(reason ?? '').trim()) throw new BadRequestException('Approved/current training is read-only. Create a new version or provide a controlled edit reason.');
  }

  private sortRows(rows: Row[], sort: string) {
    const [field, direction] = sort.split('.');
    const key = field || 'updated_at';
    return [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (direction === 'asc' ? 1 : -1));
  }

  private countBy(rows: Row[], field: string) {
    return Object.entries(rows.reduce<Record<string, Row[]>>((acc, row) => {
      const key = String(row[field] ?? 'Missing');
      acc[key] = [...(acc[key] ?? []), row];
      return acc;
    }, {})).map(([label, items]) => ({ label, count: items.length }));
  }

  private scope(user: RequestUser): Scope {
    return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) };
  }

  private siteScopedBase(user: RequestUser, req: any, column = 'site_id', includeNull = false) {
    const scope = this.scope(user);
    if (scope.selectedSiteId) return includeNull ? req.or(`${column}.is.null,${column}.eq.${this.assertSiteAccess(user, scope.selectedSiteId)}`) : req.eq(column, this.assertSiteAccess(user, scope.selectedSiteId));
    if (!scope.corporateView && scope.allowedSiteIds.length) return includeNull ? req.or(`${column}.is.null,${column}.in.(${scope.allowedSiteIds.join(',')})`) : req.in(column, scope.allowedSiteIds);
    if (!scope.corporateView) return req.eq(column, '__no_site_access__');
    return req;
  }

  private assertSiteAccess(user: RequestUser, siteId?: string | null) {
    if (!siteId) throw new BadRequestException('Site is required.');
    const scope = this.scope(user);
    if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.');
    return siteId;
  }

  private requireText(value: unknown, message: string) {
    if (!String(value ?? '').trim()) throw new BadRequestException(message);
  }

  private compact<T extends Row>(obj: T) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
  }

  private safeMany<T = Row>(query: PromiseLike<any>): Promise<T[]> {
    return this.db.many<T>(query).catch(() => []);
  }

  private must<T>(row: T | null | undefined, message: string): T {
    if (!row) throw new Error(message);
    return row;
  }

  private dateOnly(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private detailTabs(trainingId: string) {
    return [
      ['Overview', `/training-competency/required-training/library/${trainingId}`],
      ['Content Outline', `/training-competency/required-training/library/${trainingId}/content`],
      ['Delivery / Frequency', `/training-competency/required-training/library/${trainingId}/evidence-rules`],
      ['Evidence / Verification', `/training-competency/required-training/library/${trainingId}/evidence-rules`],
      ['Scope / Applicability', `/training-competency/required-training/library/${trainingId}/applicability`],
      ['Matrix Links', `/training-competency/required-training/library/${trainingId}/matrix-links`],
      ['Competency Links', `/training-competency/required-training/library/${trainingId}/competency-links`],
      ['Documents', `/training-competency/required-training/library/${trainingId}/documents`],
      ['Review & Approval', `/training-competency/required-training/library/${trainingId}`],
      ['Version History', `/training-competency/required-training/library/${trainingId}/version-history`],
      ['Change History', `/training-competency/required-training/library/${trainingId}/version-history`]
    ].map(([label, href]) => ({ label, href, enabled: true }));
  }

  private lookupPayload() {
    return { trainingCategories, trainingTypes, deliveryMethods, evidenceTypes, linkTypes, statuses, reviewStatuses, syncStatuses, documentStatuses, versionTypes, recurrenceTypes: ['One-Time', 'Recurring', 'Event Driven'], criticalities: ['Standard', 'Important', 'Safety-Critical', 'PSM-Critical', 'Work Blocker', 'Startup Blocker'] };
  }
}
