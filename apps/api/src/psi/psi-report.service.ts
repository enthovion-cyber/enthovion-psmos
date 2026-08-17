import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type SiteScope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type PsiReportContext = { tenantId: string; actorId: string; scope: SiteScope; permissions?: string[] };

const reportCategories = ['Management', 'Audit / Compliance', 'Engineering', 'Module Specific'];
const reportTypes = [
  'PSI Executive Summary', 'Site PSI Health Report', 'Unit PSI Completeness Report', 'PSI Gap Summary', 'Critical PSI Gap Report',
  'PSSR Blocker Report', 'MOC Required PSI Updates Report', 'Review Overdue Report', 'Document Gap Report', 'PSI Approval Status Report',
  'PSI Integration Health Report', 'Audit-Ready PSI Evidence Report', 'PSI Compliance Matrix', 'PSI Completeness Matrix', 'PSI Gap Register',
  'PSI Waiver Register', 'PSI Approval History Report', 'PSI Change History Report', 'Document Evidence Register',
  'Expired / Superseded Document Report', 'PSSR Startup Readiness Evidence Package', 'MOC PSI Impact Evidence Report',
  'Unit PSI Technical Package', 'Equipment PSI Technical Package', 'Chemical Hazard / SDS Report', 'Process Chemistry Report',
  'Safe Operating Limits Report', 'Equipment Design Basis Report', 'Relief Systems Design Basis Report', 'P&ID / Drawing Register Report',
  'Electrical Classification Report', 'Material Compatibility Report', 'Safeguards / Controls Report', 'HAZOP PSI Basis Package',
  'MI PSI Readiness Impact Report', 'Chemicals & SDS Summary', 'Missing / Expired SDS Report', 'High-Hazard Chemical Report',
  'Process Chemistry Hazard Report', 'Runaway / Unwanted Reaction Report', 'Critical SOL Report', 'SOL Conflict Report',
  'Missing SOL Report', 'Equipment Design Conflict Report', 'Missing Equipment Design Basis Report', 'Relief Governing Case Report',
  'Relief Capacity Conflict Report', 'Missing Relief Calculation Report', 'Current Approved Drawing Register', 'Open Redline Report',
  'Tag Index Export Report', 'Electrical Rating Mismatch Report', 'Hazardous Area Classification Report', 'Incompatible Material Report',
  'Unknown Material Compatibility Report', 'Critical Safeguard Report', 'Bypassed / Impaired Safeguard Report', 'Overdue Safeguard Testing Report'
];
const packageTypes = [
  'Full Site PSI Package', 'Unit PSI Package', 'Equipment PSI Package', 'PSSR Startup Readiness Package', 'MOC PSI Impact Package',
  'HAZOP PSI Basis Package', 'MI PSI Readiness Package', 'Audit Evidence Package', 'Document Evidence Package', 'PSI Gap Closure Package',
  'PSI Approval Package', 'PSI Completeness Package', 'Custom PSI Package'
];
const exportFormats = ['PDF', 'XLSX', 'CSV', 'JSON', 'ZIP', 'PDF + Excel', 'ZIP with documents', 'ZIP with manifest'];
const reportStatuses = ['Queued', 'Generating', 'Generated', 'Generated with Warnings', 'Failed', 'Archived', 'Superseded', 'Requires Regeneration'];
const exportStatuses = ['Queued', 'Collecting Data', 'Rendering', 'Bundling', 'Generated', 'Generated with Warnings', 'Failed', 'Cancelled', 'Archived'];
const reportSections = [
  'Executive Summary', 'Scope', 'PSI Completeness', 'Critical Gaps', 'Waivers', 'Document Evidence', 'Approval Snapshot',
  'Review History', 'Chemicals & SDS', 'Process Chemistry', 'Safe Operating Limits', 'Equipment Design Basis', 'Relief Systems',
  'Drawings / P&IDs', 'Electrical Classification', 'Material Compatibility', 'Safeguards / Controls', 'MOC Impacts',
  'PSSR Readiness', 'HAZOP Basis', 'Mechanical Integrity Dependencies', 'History / Audit Trail'
];
const scheduleFrequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semiannual', 'Annual', 'On Demand'];

const sourceTables = [
  { key: 'units', table: 'psi_units', title: 'Unit Profiles', numberField: 'unit_code', titleField: 'unit_name' },
  { key: 'chemicals', table: 'psi_chemicals', title: 'Chemicals & SDS', numberField: 'chemical_number', titleField: 'chemical_name' },
  { key: 'process-chemistry', table: 'psi_process_chemistry_records', title: 'Process Chemistry', numberField: 'record_number', titleField: 'title' },
  { key: 'safe-operating-limits', table: 'psi_safe_operating_limits', title: 'Safe Operating Limits', numberField: 'sol_number', titleField: 'parameter_name' },
  { key: 'equipment-design', table: 'psi_equipment_design_basis', title: 'Equipment Design Basis', numberField: 'basis_number', titleField: 'equipment_tag' },
  { key: 'relief-systems', table: 'psi_relief_systems', title: 'Relief Systems Design Basis', numberField: 'relief_number', titleField: 'protected_equipment_tag' },
  { key: 'drawings', table: 'psi_drawings', title: 'Drawings / P&IDs', numberField: 'drawing_number', titleField: 'drawing_title' },
  { key: 'electrical-classification', table: 'psi_electrical_classifications', title: 'Electrical Classification', numberField: 'classification_number', titleField: 'area_name' },
  { key: 'material-compatibility', table: 'psi_material_compatibility_records', title: 'Material Compatibility', numberField: 'record_number', titleField: 'material_name' },
  { key: 'safeguards', table: 'psi_safeguards', title: 'Safeguards / Controls', numberField: 'safeguard_number', titleField: 'safeguard_name' },
  { key: 'completeness', table: 'psi_completeness_evaluations', title: 'Completeness Evaluations', numberField: 'requirement_name', titleField: 'category' },
  { key: 'review-approval', table: 'psi_review_records', title: 'Review & Approval', numberField: 'review_number', titleField: 'review_title' },
  { key: 'documents', table: 'psi_unit_document_links', title: 'Document Links', numberField: 'document_number', titleField: 'document_title' },
  { key: 'integrations', table: 'psi_integration_links', title: 'MOC / PSSR / HAZOP / MI Integrations', numberField: 'source_record_number', titleField: 'source_title' }
];

@Injectable()
export class PsiReportService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(ctx: PsiReportContext, query: Record<string, any> = {}) {
    const [summary, generated, jobs, packages, scheduled, templates, history] = await Promise.all([
      this.summary(ctx),
      this.generatedReports(ctx, { ...query, limit: query.limit ?? 10 }),
      this.exportJobs(ctx, { limit: 8 }),
      this.exportPackages(ctx, { limit: 8 }),
      this.scheduledReports(ctx, { limit: 8 }),
      this.templates(ctx, { limit: 8 }),
      this.history(ctx, { limit: 8 })
    ]);
    return {
      header: {
        title: 'PSI Reports / Export',
        subtitle: 'Audit-ready report generation, PSI packages, export jobs, templates, schedules, and evidence manifests.',
        activeSiteId: this.selectedSite(ctx.scope),
        lastUpdated: new Date().toISOString(),
        canGenerate: this.has(ctx, 'psi.report.generate'),
        canExport: this.has(ctx, 'psi.export.create'),
        canSchedule: this.has(ctx, 'psi.scheduled_report.create')
      },
      summary,
      generated,
      exportJobs: jobs,
      exportPackages: packages,
      scheduledReports: scheduled,
      templates,
      history,
      attention: this.attention(summary, jobs.rows, scheduled.rows)
    };
  }

  async summary(ctx: PsiReportContext) {
    const [reports, jobs, packages, scheduled, downloads] = await Promise.all([
      this.safeMany<any>(this.applyScope(this.db.from('psi_generated_reports').select('*').eq('company_id', ctx.tenantId), ctx.scope)),
      this.safeMany<any>(this.applyScope(this.db.from('psi_export_jobs').select('*').eq('company_id', ctx.tenantId), ctx.scope)),
      this.safeMany<any>(this.applyScope(this.db.from('psi_export_packages').select('*').eq('company_id', ctx.tenantId), ctx.scope)),
      this.safeMany<any>(this.applyScope(this.db.from('psi_scheduled_reports').select('*').eq('company_id', ctx.tenantId), ctx.scope)),
      this.safeMany<any>(this.applyScope(this.db.from('psi_report_download_events').select('*').eq('company_id', ctx.tenantId), ctx.scope))
    ]);
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    return {
      generatedReports: reports.filter((row) => !row.archived_at).length,
      scheduledReports: scheduled.filter((row) => !row.archived_at && row.enabled).length,
      exportPackages: packages.filter((row) => !row.archived_at).length,
      reportsGeneratedThisMonth: reports.filter((row) => new Date(row.generated_at ?? row.created_at) >= monthStart).length,
      failedReportJobs: [...reports, ...jobs].filter((row) => row.status === 'Failed').length,
      pendingReportJobs: jobs.filter((row) => ['Queued', 'Collecting Data', 'Rendering', 'Bundling'].includes(row.status)).length,
      auditPackagesGenerated: packages.filter((row) => row.package_type === 'Audit Evidence Package').length,
      pssrPackagesGenerated: packages.filter((row) => row.package_type === 'PSSR Startup Readiness Package').length,
      mocPackagesGenerated: packages.filter((row) => row.package_type === 'MOC PSI Impact Package').length,
      hazopPsiPackagesGenerated: packages.filter((row) => row.package_type === 'HAZOP PSI Basis Package').length,
      unitPsiReports: reports.filter((row) => row.scope_type === 'Unit').length,
      equipmentPsiReports: reports.filter((row) => row.scope_type === 'Equipment').length,
      downloadsThisMonth: downloads.filter((row) => new Date(row.downloaded_at ?? row.created_at) >= monthStart).length,
      largeExportsInProgress: jobs.filter((row) => Number(row.progress_percent ?? 0) < 100 && row.include_documents).length,
      reportsRequiringRegeneration: reports.filter((row) => row.status === 'Requires Regeneration').length,
      scheduledReportsDueSoon: scheduled.filter((row) => row.next_run_at && new Date(row.next_run_at).getTime() < Date.now() + 7 * 86400000).length
    };
  }

  async templates(ctx: PsiReportContext, query: Record<string, any> = {}) {
    const page = this.page(query);
    let request: any = this.applyScope(this.db.from('psi_report_templates').select('*', { count: 'exact' }).eq('company_id', ctx.tenantId), ctx.scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.search) request = request.or(`template_name.ilike.%${query.search}%,template_type.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    if (query.reportCategory) request = request.eq('report_category', query.reportCategory);
    if (query.templateType) request = request.eq('template_type', query.templateType);
    const { data, error, count } = await request.order('updated_at', { ascending: false }).range(page.from, page.to);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], page: page.page, limit: page.limit, total: count ?? data?.length ?? 0 };
  }

  async template(ctx: PsiReportContext, templateId: string) {
    const row = await this.safeSingle<any>(this.applyScope(this.db.from('psi_report_templates').select('*').eq('company_id', ctx.tenantId).eq('id', templateId), ctx.scope).maybeSingle());
    if (!row) throw new NotFoundException('PSI report template not found.');
    return row;
  }

  async saveTemplate(ctx: PsiReportContext, dto: Record<string, any>, templateId?: string) {
    this.requirePermission(ctx, templateId ? 'psi.report.template.edit' : 'psi.report.template.create');
    const now = new Date().toISOString();
    const siteId = this.siteFromDto(ctx.scope, dto);
    const payload: Record<string, any> = this.clean({
      company_id: ctx.tenantId,
      site_id: siteId,
      template_name: this.required(dto.templateName ?? dto.template_name, 'Template name is required.'),
      template_type: this.required(dto.templateType ?? dto.template_type, 'Report type is required.'),
      report_category: dto.reportCategory ?? dto.report_category ?? 'Management',
      description: dto.description ?? null,
      scope_type: dto.scopeType ?? dto.scope_type ?? 'Site',
      module_keys: this.arrayJson(dto.moduleKeys ?? dto.module_keys),
      section_config_json: dto.sectionConfig ?? dto.section_config_json ?? {},
      evidence_config_json: dto.evidenceConfig ?? dto.evidence_config_json ?? {},
      output_config_json: dto.outputConfig ?? dto.output_config_json ?? {},
      include_documents: Boolean(dto.includeDocuments ?? dto.include_documents),
      include_redacted_content: Boolean(dto.includeRedactedContent ?? dto.include_redacted_content),
      default_format: dto.defaultFormat ?? dto.default_format ?? 'PDF',
      updated_by: ctx.actorId,
      updated_at: now
    });
    if (!templateId) {
      payload.id = randomUUID();
      payload.template_number = await this.nextNumber(ctx.tenantId, 'PSI-TPL', 'psi_report_templates', 'template_number');
      payload.created_by = ctx.actorId;
      payload.created_at = now;
    }
    const before = templateId ? await this.template(ctx, templateId) : null;
    const query = templateId
      ? this.db.from('psi_report_templates').update(payload).eq('company_id', ctx.tenantId).eq('id', templateId).select().single()
      : this.db.from('psi_report_templates').insert(payload).select().single();
    const row = await this.requireRow(this.db.single<any>(query), 'Unable to save PSI report template.');
    await this.writeHistory(ctx, templateId ? 'psi.report_template.updated' : 'psi.report_template.created', 'PSI_REPORT_TEMPLATE', row.id, before, row, row.site_id, templateId ? 'Report template updated' : 'Report template created', row.template_name);
    return row;
  }

  async archiveTemplate(ctx: PsiReportContext, templateId: string, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.report.template.archive');
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const before = await this.template(ctx, templateId);
    const row = await this.requireRow(this.db.single<any>(this.db.from('psi_report_templates').update({ archived_at: new Date().toISOString(), archived_by: ctx.actorId, archive_reason: dto.reason, active: false, updated_by: ctx.actorId, updated_at: new Date().toISOString() }).eq('company_id', ctx.tenantId).eq('id', templateId).select().single()), 'Unable to archive template.');
    await this.writeHistory(ctx, 'psi.report_template.archived', 'PSI_REPORT_TEMPLATE', row.id, before, row, row.site_id, 'Report template archived', dto.reason);
    return row;
  }

  async cloneTemplate(ctx: PsiReportContext, templateId: string, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.report.template.create');
    const source = await this.template(ctx, templateId);
    const clone = { ...source, templateName: dto.templateName ?? `${source.template_name} Copy`, template_type: source.template_type, templateId: undefined };
    delete clone.id; delete clone.template_number; delete clone.archived_at; delete clone.archived_by; delete clone.archive_reason;
    return this.saveTemplate(ctx, clone);
  }

  async generatedReports(ctx: PsiReportContext, query: Record<string, any> = {}) {
    const page = this.page(query);
    let request: any = this.applyScope(this.db.from('psi_generated_reports').select('*', { count: 'exact' }).eq('company_id', ctx.tenantId), ctx.scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.search) request = request.or(`report_name.ilike.%${query.search}%,report_number.ilike.%${query.search}%,report_type.ilike.%${query.search}%`);
    if (query.status) request = request.eq('status', query.status);
    if (query.reportType) request = request.eq('report_type', query.reportType);
    if (query.unitId) request = request.eq('unit_id', query.unitId);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    const { data, error, count } = await request.order('generated_at', { ascending: false }).range(page.from, page.to);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], page: page.page, limit: page.limit, total: count ?? data?.length ?? 0 };
  }

  async reportDetail(ctx: PsiReportContext, reportId: string) {
    const report = await this.safeSingle<any>(this.applyScope(this.db.from('psi_generated_reports').select('*').eq('company_id', ctx.tenantId).eq('id', reportId), ctx.scope).maybeSingle());
    if (!report) throw new NotFoundException('Generated PSI report not found.');
    const [files, history] = await Promise.all([
      this.reportFiles(ctx, reportId),
      this.history(ctx, { relatedRecordType: 'PSI_GENERATED_REPORT', relatedRecordId: reportId, limit: 20 })
    ]);
    return { report, files, history };
  }

  async reportPreview(ctx: PsiReportContext, reportId: string) {
    const detail = await this.reportDetail(ctx, reportId);
    return {
      ...detail.report,
      previewSections: detail.report.sections_json ?? [],
      sourceSnapshot: detail.report.source_snapshot_json ?? {},
      completenessSnapshot: detail.report.completeness_snapshot_json ?? {},
      documentSnapshot: detail.report.document_snapshot_json ?? {},
      approvalSnapshot: detail.report.approval_snapshot_json ?? {},
      warnings: detail.report.warnings_json ?? [],
      files: detail.files
    };
  }

  async reportFiles(ctx: PsiReportContext, reportId: string) {
    return this.safeMany<any>(this.db.from('psi_report_files').select('*').eq('company_id', ctx.tenantId).eq('generated_report_id', reportId).order('created_at', { ascending: false }));
  }

  async generateReport(ctx: PsiReportContext, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.report.generate');
    const scopeType = String(dto.scopeType ?? dto.scope_type ?? 'Site');
    this.assertScopePermission(ctx, scopeType);
    const template = dto.templateId ? await this.template(ctx, String(dto.templateId)) : null;
    const reportType = String(dto.reportType ?? dto.report_type ?? template?.template_type ?? '');
    if (!reportType) throw new BadRequestException('Report type is required.');
    const outputFormat = String(dto.outputFormat ?? dto.format ?? template?.default_format ?? 'PDF');
    const moduleKeys = this.arrayJson(dto.moduleKeys ?? dto.module_keys ?? template?.module_keys ?? this.defaultModulesFor(reportType));
    const includeDocuments = Boolean(dto.includeDocuments ?? dto.include_documents ?? template?.include_documents);
    if (includeDocuments) this.requirePermission(ctx, 'psi.export.create_with_documents');
    const scopeJson = this.scopeJson(ctx, { ...dto, scopeType });
    const snapshot = await this.collectReportData(ctx, { scopeType, scopeJson, moduleKeys });
    const warnings = this.reportWarnings(snapshot, includeDocuments);
    const now = new Date().toISOString();
    const reportId = randomUUID();
    const reportName = String(dto.reportName ?? dto.report_name ?? template?.template_name ?? reportType);
    const report = await this.requireRow(this.db.single<any>(this.db.from('psi_generated_reports').insert({
      id: reportId,
      company_id: ctx.tenantId,
      site_id: scopeJson.siteId ?? this.selectedSite(ctx.scope),
      unit_id: scopeJson.unitId ?? null,
      equipment_id: scopeJson.equipmentId ?? null,
      template_id: template?.id ?? null,
      report_number: await this.nextNumber(ctx.tenantId, 'PSI-RPT', 'psi_generated_reports', 'report_number'),
      report_name: reportName,
      report_type: reportType,
      report_category: dto.reportCategory ?? template?.report_category ?? this.categoryFor(reportType),
      scope_type: scopeType,
      scope_json: scopeJson,
      sections_json: dto.sections ?? template?.section_config_json?.required ?? reportSections.slice(0, 8),
      source_snapshot_json: snapshot.source,
      completeness_snapshot_json: snapshot.completeness,
      approval_snapshot_json: snapshot.approvals,
      document_snapshot_json: snapshot.documents,
      integration_snapshot_json: snapshot.integrations,
      status: warnings.length ? 'Generated with Warnings' : 'Generated',
      format: outputFormat,
      generated_with_warnings: warnings.length > 0,
      warnings_json: warnings,
      blockers_json: snapshot.blockers,
      redaction_applied: Boolean(dto.redactionMode && dto.redactionMode !== 'None'),
      document_inclusion_status: includeDocuments ? 'Documents requested' : 'Metadata only',
      storage_key: `psi-reports/${ctx.tenantId}/${reportId}/${this.slug(reportName)}.${this.extension(outputFormat)}`,
      generated_by: ctx.actorId,
      generated_at: now,
      created_at: now,
      updated_at: now
    }).select().single()), 'Unable to generate PSI report.');
    const file = await this.createReportFile(ctx, report, outputFormat, 'Report output');
    await this.safeSingle(this.db.from('psi_generated_reports').update({ file_count: 1 }).eq('id', report.id).select().single());
    await this.writeHistory(ctx, 'psi.report.generated', 'PSI_GENERATED_REPORT', report.id, null, { ...report, file }, report.site_id, 'PSI report generated', report.report_name);
    return { ...report, files: [file], warnings };
  }

  async regenerateReport(ctx: PsiReportContext, reportId: string, dto: Record<string, any> = {}) {
    this.requirePermission(ctx, 'psi.report.regenerate');
    const before = await this.reportDetail(ctx, reportId);
    const report = await this.generateReport(ctx, { ...before.report, ...dto, reportName: dto.reportName ?? `${before.report.report_name} Regenerated`, templateId: before.report.template_id });
    await this.safeSingle(this.db.from('psi_generated_reports').update({ status: 'Superseded', archived_at: new Date().toISOString(), archived_by: ctx.actorId, archive_reason: dto.reason ?? `Regenerated as ${report.id}` }).eq('company_id', ctx.tenantId).eq('id', reportId).select().single());
    await this.writeHistory(ctx, 'psi.report.regenerated', 'PSI_GENERATED_REPORT', report.id, before.report, report, report.site_id, 'PSI report regenerated', dto.reason ?? 'Report regenerated from latest PSI data.');
    return report;
  }

  async archiveReport(ctx: PsiReportContext, reportId: string, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.report.archive');
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const before = await this.reportDetail(ctx, reportId);
    const row = await this.requireRow(this.db.single<any>(this.db.from('psi_generated_reports').update({ archived_at: new Date().toISOString(), archived_by: ctx.actorId, archive_reason: dto.reason, status: 'Archived', updated_at: new Date().toISOString() }).eq('company_id', ctx.tenantId).eq('id', reportId).select().single()), 'Unable to archive report.');
    await this.writeHistory(ctx, 'psi.report.archived', 'PSI_GENERATED_REPORT', row.id, before.report, row, row.site_id, 'PSI report archived', dto.reason);
    return row;
  }

  async downloadFile(ctx: PsiReportContext, fileId: string, metadata: Record<string, any> = {}) {
    this.requirePermission(ctx, 'psi.report.download');
    const file = await this.safeSingle<any>(this.applyScope(this.db.from('psi_report_files').select('*').eq('company_id', ctx.tenantId).eq('id', fileId), ctx.scope).maybeSingle());
    if (!file) throw new NotFoundException('Report file not found.');
    const event = await this.safeSingle<any>(this.db.from('psi_report_download_events').insert({
      id: randomUUID(), company_id: ctx.tenantId, site_id: file.site_id, generated_report_id: file.generated_report_id,
      export_job_id: file.export_job_id, package_id: file.package_id, file_id: file.id, download_type: file.file_format,
      downloaded_by: ctx.actorId, metadata_json: metadata
    }).select().single());
    await this.safeSingle(this.db.from('psi_report_files').update({ download_count: Number(file.download_count ?? 0) + 1, last_downloaded_at: new Date().toISOString() }).eq('id', file.id).select().single());
    await this.writeHistory(ctx, 'psi.report_file.downloaded', 'PSI_REPORT_FILE', file.id, file, { ...file, downloadEventId: event?.id }, file.site_id, 'PSI report file downloaded', file.file_name);
    return { file, downloadEvent: event, downloadUrl: null, message: 'Secure signed URL generation is handled by the configured storage adapter. No raw private storage URL is exposed.' };
  }

  async exportJobs(ctx: PsiReportContext, query: Record<string, any> = {}) {
    const page = this.page(query);
    let request: any = this.applyScope(this.db.from('psi_export_jobs').select('*', { count: 'exact' }).eq('company_id', ctx.tenantId), ctx.scope);
    if (query.status) request = request.eq('status', query.status);
    if (query.exportType) request = request.eq('export_type', query.exportType);
    const { data, error, count } = await request.order('requested_at', { ascending: false }).range(page.from, page.to);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], page: page.page, limit: page.limit, total: count ?? data?.length ?? 0 };
  }

  async exportJob(ctx: PsiReportContext, jobId: string) {
    const job = await this.safeSingle<any>(this.applyScope(this.db.from('psi_export_jobs').select('*').eq('company_id', ctx.tenantId).eq('id', jobId), ctx.scope).maybeSingle());
    if (!job) throw new NotFoundException('PSI export job not found.');
    const pkg = job.package_id ? await this.packageDetail(ctx, job.package_id).catch(() => null) : null;
    const files = await this.safeMany<any>(this.db.from('psi_report_files').select('*').eq('company_id', ctx.tenantId).eq('export_job_id', job.id).order('created_at', { ascending: false }));
    return { job, package: pkg, files };
  }

  async createExport(ctx: PsiReportContext, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.export.create');
    const includeDocuments = Boolean(dto.includeDocuments ?? dto.include_documents);
    if (includeDocuments) this.requirePermission(ctx, 'psi.export.create_with_documents');
    const scopeType = String(dto.scopeType ?? dto.scope_type ?? 'Site');
    const outputFormat = String(dto.outputFormat ?? dto.output_format ?? 'ZIP');
    const packageType = String(dto.packageType ?? dto.package_type ?? this.packageTypeFor(scopeType));
    const moduleKeys = this.arrayJson(dto.moduleKeys ?? dto.module_keys ?? this.defaultModulesFor(packageType));
    const scopeJson = this.scopeJson(ctx, { ...dto, scopeType });
    const snapshot = await this.collectReportData(ctx, { scopeType, scopeJson, moduleKeys });
    const warnings = this.reportWarnings(snapshot, includeDocuments);
    const now = new Date().toISOString();
    const jobId = randomUUID();
    const job = await this.requireRow(this.db.single<any>(this.db.from('psi_export_jobs').insert({
      id: jobId,
      company_id: ctx.tenantId,
      site_id: scopeJson.siteId ?? this.selectedSite(ctx.scope),
      unit_id: scopeJson.unitId ?? null,
      equipment_id: scopeJson.equipmentId ?? null,
      export_number: await this.nextNumber(ctx.tenantId, 'PSI-EXP', 'psi_export_jobs', 'export_number'),
      export_name: String(dto.exportName ?? dto.export_name ?? packageType),
      export_type: String(dto.exportType ?? dto.export_type ?? 'Package'),
      package_type: packageType,
      scope_type: scopeType,
      scope_json: scopeJson,
      module_keys: moduleKeys,
      output_format: outputFormat,
      include_documents: includeDocuments,
      include_manifest: dto.includeManifest !== false,
      include_history: Boolean(dto.includeHistory ?? dto.include_history),
      include_approvals: dto.includeApprovals !== false,
      redaction_mode: dto.redactionMode ?? dto.redaction_mode ?? 'Permission based',
      status: warnings.length ? 'Generated with Warnings' : 'Generated',
      progress_percent: 100,
      warnings_json: warnings,
      requested_by: ctx.actorId,
      requested_at: now,
      started_at: now,
      completed_at: now,
      created_at: now,
      updated_at: now
    }).select().single()), 'Unable to create PSI export job.');
    const pkg = await this.createPackage(ctx, job, snapshot, warnings);
    await this.safeSingle(this.db.from('psi_export_jobs').update({ package_id: pkg.id }).eq('id', job.id).select().single());
    await this.writeHistory(ctx, 'psi.export.generated', 'PSI_EXPORT_JOB', job.id, null, { ...job, packageId: pkg.id }, job.site_id, 'PSI export package generated', job.export_name);
    return { ...job, package: pkg, warnings };
  }

  async cancelExport(ctx: PsiReportContext, jobId: string, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.export.cancel');
    if (!dto.reason) throw new BadRequestException('Cancel requires a reason.');
    const before = await this.exportJob(ctx, jobId);
    const row = await this.requireRow(this.db.single<any>(this.db.from('psi_export_jobs').update({ status: 'Cancelled', cancelled_at: new Date().toISOString(), cancelled_by: ctx.actorId, cancel_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', ctx.tenantId).eq('id', jobId).select().single()), 'Unable to cancel export job.');
    await this.writeHistory(ctx, 'psi.export.cancelled', 'PSI_EXPORT_JOB', row.id, before.job, row, row.site_id, 'PSI export cancelled', dto.reason);
    return row;
  }

  async retryExport(ctx: PsiReportContext, jobId: string) {
    this.requirePermission(ctx, 'psi.export.regenerate');
    const before = await this.exportJob(ctx, jobId);
    return this.createExport(ctx, { ...before.job, exportName: `${before.job.export_name} Retry`, packageType: before.job.package_type });
  }

  async exportPackages(ctx: PsiReportContext, query: Record<string, any> = {}) {
    const page = this.page(query);
    let request: any = this.applyScope(this.db.from('psi_export_packages').select('*', { count: 'exact' }).eq('company_id', ctx.tenantId), ctx.scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.packageType) request = request.eq('package_type', query.packageType);
    const { data, error, count } = await request.order('generated_at', { ascending: false }).range(page.from, page.to);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], page: page.page, limit: page.limit, total: count ?? data?.length ?? 0 };
  }

  async packageDetail(ctx: PsiReportContext, packageId: string) {
    const pkg = await this.safeSingle<any>(this.applyScope(this.db.from('psi_export_packages').select('*').eq('company_id', ctx.tenantId).eq('id', packageId), ctx.scope).maybeSingle());
    if (!pkg) throw new NotFoundException('PSI export package not found.');
    const [items, files, history] = await Promise.all([
      this.safeMany<any>(this.db.from('psi_export_package_items').select('*').eq('company_id', ctx.tenantId).eq('package_id', packageId).order('created_at')),
      this.safeMany<any>(this.db.from('psi_report_files').select('*').eq('company_id', ctx.tenantId).eq('package_id', packageId).order('created_at')),
      this.history(ctx, { relatedRecordType: 'PSI_EXPORT_PACKAGE', relatedRecordId: packageId, limit: 20 })
    ]);
    return { package: pkg, items, files, history };
  }

  async archivePackage(ctx: PsiReportContext, packageId: string, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.export.archive');
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const before = await this.packageDetail(ctx, packageId);
    const row = await this.requireRow(this.db.single<any>(this.db.from('psi_export_packages').update({ archived_at: new Date().toISOString(), archived_by: ctx.actorId, archive_reason: dto.reason, status: 'Archived', updated_at: new Date().toISOString() }).eq('company_id', ctx.tenantId).eq('id', packageId).select().single()), 'Unable to archive package.');
    await this.writeHistory(ctx, 'psi.export_package.archived', 'PSI_EXPORT_PACKAGE', row.id, before.package, row, row.site_id, 'PSI export package archived', dto.reason);
    return row;
  }

  async scheduledReports(ctx: PsiReportContext, query: Record<string, any> = {}) {
    const page = this.page(query);
    let request: any = this.applyScope(this.db.from('psi_scheduled_reports').select('*', { count: 'exact' }).eq('company_id', ctx.tenantId), ctx.scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.status) request = request.eq('status', query.status);
    const { data, error, count } = await request.order('next_run_at', { ascending: true, nullsFirst: false }).range(page.from, page.to);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], page: page.page, limit: page.limit, total: count ?? data?.length ?? 0 };
  }

  async scheduledReport(ctx: PsiReportContext, scheduleId: string) {
    const row = await this.safeSingle<any>(this.applyScope(this.db.from('psi_scheduled_reports').select('*').eq('company_id', ctx.tenantId).eq('id', scheduleId), ctx.scope).maybeSingle());
    if (!row) throw new NotFoundException('Scheduled PSI report not found.');
    return row;
  }

  async saveSchedule(ctx: PsiReportContext, dto: Record<string, any>, scheduleId?: string) {
    this.requirePermission(ctx, scheduleId ? 'psi.scheduled_report.edit' : 'psi.scheduled_report.create');
    const now = new Date().toISOString();
    const scopeType = String(dto.scopeType ?? dto.scope_type ?? 'Site');
    const scopeJson = this.scopeJson(ctx, { ...dto, scopeType });
    const payload: Record<string, any> = this.clean({
      company_id: ctx.tenantId,
      site_id: scopeJson.siteId ?? this.selectedSite(ctx.scope),
      schedule_name: this.required(dto.scheduleName ?? dto.schedule_name, 'Schedule name is required.'),
      template_id: dto.templateId ?? dto.template_id ?? null,
      report_type: this.required(dto.reportType ?? dto.report_type, 'Report type is required.'),
      scope_type: scopeType,
      scope_json: scopeJson,
      frequency: dto.frequency ?? 'Monthly',
      timezone: dto.timezone ?? 'UTC',
      next_run_at: dto.nextRunAt ?? dto.next_run_at ?? null,
      recipient_user_ids: this.arrayJson(dto.recipientUserIds ?? dto.recipient_user_ids),
      recipient_emails: this.arrayJson(dto.recipientEmails ?? dto.recipient_emails),
      output_format: dto.outputFormat ?? dto.output_format ?? 'PDF',
      include_documents: Boolean(dto.includeDocuments ?? dto.include_documents),
      enabled: dto.enabled !== false,
      status: dto.status ?? 'Active',
      updated_by: ctx.actorId,
      updated_at: now
    });
    if (!scheduleId) {
      payload.id = randomUUID();
      payload.created_by = ctx.actorId;
      payload.created_at = now;
    }
    const before = scheduleId ? await this.scheduledReport(ctx, scheduleId) : null;
    const query = scheduleId
      ? this.db.from('psi_scheduled_reports').update(payload).eq('company_id', ctx.tenantId).eq('id', scheduleId).select().single()
      : this.db.from('psi_scheduled_reports').insert(payload).select().single();
    const row = await this.requireRow(this.db.single<any>(query), 'Unable to save scheduled report.');
    await this.writeHistory(ctx, scheduleId ? 'psi.scheduled_report.updated' : 'psi.scheduled_report.created', 'PSI_SCHEDULED_REPORT', row.id, before, row, row.site_id, scheduleId ? 'Scheduled PSI report updated' : 'Scheduled PSI report created', row.schedule_name);
    return row;
  }

  async runScheduleNow(ctx: PsiReportContext, scheduleId: string) {
    const schedule = await this.scheduledReport(ctx, scheduleId);
    const report = await this.generateReport(ctx, { ...schedule.scope_json, reportType: schedule.report_type, outputFormat: schedule.output_format, includeDocuments: schedule.include_documents, templateId: schedule.template_id, reportName: schedule.schedule_name });
    await this.safeSingle(this.db.from('psi_scheduled_reports').update({ last_run_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', scheduleId).select().single());
    await this.writeHistory(ctx, 'psi.scheduled_report.run_now', 'PSI_SCHEDULED_REPORT', scheduleId, schedule, { scheduleId, reportId: report.id }, schedule.site_id, 'Scheduled PSI report run', schedule.schedule_name);
    return report;
  }

  async archiveSchedule(ctx: PsiReportContext, scheduleId: string, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.scheduled_report.archive');
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const before = await this.scheduledReport(ctx, scheduleId);
    const row = await this.requireRow(this.db.single<any>(this.db.from('psi_scheduled_reports').update({ archived_at: new Date().toISOString(), archived_by: ctx.actorId, archive_reason: dto.reason, status: 'Archived', enabled: false, updated_by: ctx.actorId, updated_at: new Date().toISOString() }).eq('company_id', ctx.tenantId).eq('id', scheduleId).select().single()), 'Unable to archive scheduled report.');
    await this.writeHistory(ctx, 'psi.scheduled_report.archived', 'PSI_SCHEDULED_REPORT', row.id, before, row, row.site_id, 'Scheduled PSI report archived', dto.reason);
    return row;
  }

  async settings(ctx: PsiReportContext) {
    const siteId = this.selectedSite(ctx.scope);
    const row = await this.safeSingle<any>(this.db.from('psi_report_settings').select('*').eq('company_id', ctx.tenantId).eq('site_id', siteId ?? '').maybeSingle())
      ?? await this.safeSingle<any>(this.db.from('psi_report_settings').select('*').eq('company_id', ctx.tenantId).is('site_id', null).maybeSingle());
    if (row) return row;
    return this.requireRow(this.db.single<any>(this.db.from('psi_report_settings').insert({ id: randomUUID(), company_id: ctx.tenantId, site_id: null }).select().single()), 'Unable to create report settings.');
  }

  async updateSettings(ctx: PsiReportContext, dto: Record<string, any>) {
    this.requirePermission(ctx, 'psi.report.settings.edit');
    const before = await this.settings(ctx);
    const row = await this.requireRow(this.db.single<any>(this.db.from('psi_report_settings').update({
      default_format: dto.defaultFormat ?? dto.default_format ?? before.default_format,
      default_redaction_mode: dto.defaultRedactionMode ?? dto.default_redaction_mode ?? before.default_redaction_mode,
      allow_document_exports: dto.allowDocumentExports ?? dto.allow_document_exports ?? before.allow_document_exports,
      require_approval_snapshot_for_official: dto.requireApprovalSnapshotForOfficial ?? dto.require_approval_snapshot_for_official ?? before.require_approval_snapshot_for_official,
      max_export_size_mb: dto.maxExportSizeMb ?? dto.max_export_size_mb ?? before.max_export_size_mb,
      retention_days: dto.retentionDays ?? dto.retention_days ?? before.retention_days,
      schedule_timezone: dto.scheduleTimezone ?? dto.schedule_timezone ?? before.schedule_timezone,
      notification_settings_json: dto.notificationSettings ?? dto.notification_settings_json ?? before.notification_settings_json,
      updated_by: ctx.actorId,
      updated_at: new Date().toISOString()
    }).eq('company_id', ctx.tenantId).eq('id', before.id).select().single()), 'Unable to update report settings.');
    await this.writeHistory(ctx, 'psi.report_settings.updated', 'PSI_REPORT_SETTINGS', row.id, before, row, row.site_id, 'PSI report settings updated', 'Report/export settings changed.');
    return row;
  }

  async history(ctx: PsiReportContext, query: Record<string, any> = {}) {
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 200);
    let request: any = this.applyScope(this.db.from('psi_report_history_events').select('*').eq('company_id', ctx.tenantId), ctx.scope);
    if (query.relatedRecordType) request = request.eq('related_record_type', query.relatedRecordType);
    if (query.relatedRecordId) request = request.eq('related_record_id', query.relatedRecordId);
    if (query.eventType) request = request.eq('event_type', query.eventType);
    return this.safeMany<any>(request.order('created_at', { ascending: false }).limit(limit));
  }

  lookups(kind: string) {
    const map: Record<string, string[]> = {
      'report-categories': reportCategories,
      'report-types': reportTypes,
      'export-package-types': packageTypes,
      'export-formats': exportFormats,
      'report-statuses': reportStatuses,
      'export-statuses': exportStatuses,
      'report-sections': reportSections,
      'schedule-frequencies': scheduleFrequencies
    };
    return map[kind] ?? [];
  }

  async scopedReport(ctx: PsiReportContext, scopeType: string, sourceId: string | undefined, dto: Record<string, any>) {
    const payload: Record<string, any> = { ...dto, scopeType };
    if (scopeType === 'Unit' && sourceId) payload.unitId = sourceId;
    if (scopeType === 'Equipment' && sourceId) payload.equipmentId = sourceId;
    return this.generateReport(ctx, payload);
  }

  async scopedExport(ctx: PsiReportContext, scopeType: string, sourceId: string | undefined, dto: Record<string, any>) {
    const payload: Record<string, any> = { ...dto, scopeType };
    if (scopeType === 'Unit' && sourceId) payload.unitId = sourceId;
    if (scopeType === 'Equipment' && sourceId) payload.equipmentId = sourceId;
    return this.createExport(ctx, payload);
  }

  async moduleReports(ctx: PsiReportContext, moduleKey: string, query: Record<string, any> = {}) {
    return {
      moduleKey,
      templates: await this.templates(ctx, { ...query, search: moduleKey }),
      generated: await this.generatedReports(ctx, { ...query, limit: query.limit ?? 25 }),
      reportTypes: reportTypes.filter((type) => this.defaultModulesFor(type).includes(moduleKey))
    };
  }

  private async createPackage(ctx: PsiReportContext, job: any, snapshot: any, warnings: any[]) {
    const packageId = randomUUID();
    const manifest = {
      packageId,
      exportJobId: job.id,
      generatedAt: new Date().toISOString(),
      scope: job.scope_json,
      modules: job.module_keys,
      warnings,
      counts: snapshot.counts
    };
    const pkg = await this.requireRow(this.db.single<any>(this.db.from('psi_export_packages').insert({
      id: packageId,
      company_id: ctx.tenantId,
      site_id: job.site_id,
      export_job_id: job.id,
      package_number: await this.nextNumber(ctx.tenantId, 'PSI-PKG', 'psi_export_packages', 'package_number'),
      package_name: job.export_name,
      package_type: job.package_type,
      scope_type: job.scope_type,
      scope_json: job.scope_json,
      manifest_json: manifest,
      source_snapshot_json: snapshot.source,
      document_snapshot_json: snapshot.documents,
      approval_snapshot_json: snapshot.approvals,
      status: warnings.length ? 'Generated with Warnings' : 'Generated',
      storage_key: `psi-exports/${ctx.tenantId}/${packageId}/${this.slug(job.export_name)}.zip`,
      file_count: 1,
      document_count: Number(snapshot.counts.documents ?? 0),
      warning_count: warnings.length,
      generated_by: ctx.actorId
    }).select().single()), 'Unable to create PSI export package.');
    const file = await this.createReportFile(ctx, { ...pkg, id: null }, job.output_format, 'Export package', job.id, pkg.id);
    const items = this.packageItemsFromSnapshot(ctx, pkg, snapshot, file);
    if (items.length) await this.safeMany<any>(this.db.from('psi_export_package_items').insert(items).select());
    await this.writeHistory(ctx, 'psi.export_package.generated', 'PSI_EXPORT_PACKAGE', pkg.id, null, pkg, pkg.site_id, 'PSI export package generated', pkg.package_name);
    return { ...pkg, file, items };
  }

  private async createReportFile(ctx: PsiReportContext, source: any, format: string, label: string, exportJobId?: string | null, packageId?: string | null) {
    return this.requireRow(this.db.single<any>(this.db.from('psi_report_files').insert({
      id: randomUUID(),
      company_id: ctx.tenantId,
      site_id: source.site_id,
      generated_report_id: source.report_number ? source.id : null,
      export_job_id: exportJobId ?? null,
      package_id: packageId ?? (source.package_number ? source.id : null),
      file_name: `${this.slug(source.report_name ?? source.package_name ?? label)}.${this.extension(format)}`,
      file_type: label,
      file_format: format,
      storage_bucket: 'psi-reports',
      storage_key: source.storage_key ?? `psi-reports/${ctx.tenantId}/${randomUUID()}/${label}.${this.extension(format)}`,
      classification: 'Internal',
      created_by: ctx.actorId
    }).select().single()), 'Unable to create report file metadata.');
  }

  private packageItemsFromSnapshot(ctx: PsiReportContext, pkg: any, snapshot: any, file: any) {
    const items: any[] = [{
      id: randomUUID(), company_id: ctx.tenantId, site_id: pkg.site_id, package_id: pkg.id, item_type: 'Manifest',
      title: 'Package manifest', file_id: file.id, included: true, metadata_json: pkg.manifest_json
    }];
    for (const module of Object.values(snapshot.source ?? {}) as any[]) {
      const rows = Array.isArray(module?.rows) ? module.rows : [];
      for (const row of rows.slice(0, 100)) {
        items.push({
          id: randomUUID(), company_id: ctx.tenantId, site_id: pkg.site_id, package_id: pkg.id, item_type: 'PSI Record',
          source_module: module.key, source_record_id: row.id ?? null, source_record_number: row.recordNumber ?? null,
          title: row.title ?? row.recordNumber ?? module.title, included: true, metadata_json: row
        });
      }
    }
    return items;
  }

  private async collectReportData(ctx: PsiReportContext, options: { scopeType: string; scopeJson: Record<string, any>; moduleKeys: string[] }) {
    const modules = options.moduleKeys.length ? options.moduleKeys : sourceTables.map((table) => table.key);
    const source: Record<string, any> = {};
    const counts: Record<string, number> = {};
    const blockers: any[] = [];
    for (const table of sourceTables.filter((entry) => modules.includes(entry.key))) {
      const rows = await this.sourceRows(ctx, table, options.scopeJson);
      const mapped = rows.map((row) => ({
        id: row.id,
        recordNumber: row[table.numberField] ?? row.unit_code ?? row.document_number ?? row.id,
        title: row[table.titleField] ?? row.unit_name ?? row.title ?? row.document_title ?? row.id,
        status: row.status ?? row.psi_status ?? row.review_status ?? row.completeness_status ?? 'Not Determined',
        siteId: row.site_id ?? row.siteId ?? null,
        unitId: row.unit_id ?? row.unitId ?? null,
        equipmentId: row.equipment_id ?? row.equipmentId ?? null,
        updatedAt: row.updated_at ?? row.updatedAt ?? row.created_at
      }));
      source[table.key] = { key: table.key, title: table.title, rows: mapped, total: rows.length };
      counts[table.key] = rows.length;
      if (table.key === 'completeness') {
        const critical = rows.filter((row) => String(row.status ?? row.completeness_status ?? '').toLowerCase().includes('gap') || row.critical === true);
        if (critical.length) blockers.push({ category: 'Completeness', count: critical.length, message: `${critical.length} completeness gaps are included in this report snapshot.` });
      }
    }
    const documents = source.documents ?? { rows: [], total: 0 };
    const approvals = source['review-approval'] ?? { rows: [], total: 0 };
    const integrations = source.integrations ?? { rows: [], total: 0 };
    return {
      source,
      counts,
      completeness: source.completeness ?? { rows: [], total: 0 },
      approvals,
      documents,
      integrations,
      blockers
    };
  }

  private async sourceRows(ctx: PsiReportContext, table: any, scopeJson: Record<string, any>) {
    let request: any = this.applyScope(this.db.from(table.table).select('*').eq('company_id', ctx.tenantId), ctx.scope);
    if (scopeJson.unitId) request = request.eq('unit_id', scopeJson.unitId);
    if (scopeJson.equipmentId) request = request.eq('equipment_id', scopeJson.equipmentId);
    const rows = await this.safeMany<any>(request.limit(500));
    return rows.filter((row) => {
      if (scopeJson.unitId && row.unit_id !== scopeJson.unitId && row.unitId !== scopeJson.unitId) return false;
      if (scopeJson.equipmentId && row.equipment_id !== scopeJson.equipmentId && row.equipmentId !== scopeJson.equipmentId) return false;
      return true;
    });
  }

  private reportWarnings(snapshot: any, includeDocuments: boolean) {
    const warnings = [...(snapshot.blockers ?? [])];
    if (includeDocuments && Number(snapshot.counts.documents ?? 0) === 0) warnings.push({ category: 'Document Control', message: 'No linked controlled documents were found for this PSI scope.' });
    if (Number(snapshot.counts.completeness ?? 0) === 0) warnings.push({ category: 'Completeness', message: 'No completeness run snapshot was found. Generate/re-run PSI completeness for a stronger report package.' });
    if (Number(snapshot.counts['review-approval'] ?? 0) === 0) warnings.push({ category: 'Review & Approval', message: 'No approval snapshot was found. Official/audit packages may require approved PSI records.' });
    return warnings;
  }

  private attention(summary: any, jobs: any[], scheduled: any[]) {
    return [
      { label: 'Failed report/export jobs', value: summary.failedReportJobs, tone: summary.failedReportJobs ? 'danger' : 'good' },
      { label: 'Large exports in progress', value: summary.largeExportsInProgress, tone: summary.largeExportsInProgress ? 'warn' : 'good' },
      { label: 'Scheduled reports due soon', value: summary.scheduledReportsDueSoon, tone: summary.scheduledReportsDueSoon ? 'warn' : 'neutral' },
      { label: 'Pending export jobs', value: jobs.filter((job) => job.status === 'Queued').length, tone: 'neutral' },
      { label: 'Schedules needing attention', value: scheduled.filter((row) => row.failure_count > 0).length, tone: scheduled.some((row) => row.failure_count > 0) ? 'danger' : 'good' }
    ];
  }

  private scopeJson(ctx: PsiReportContext, dto: Record<string, any>) {
    const siteId = dto.siteId ?? dto.site_id ?? this.selectedSite(ctx.scope);
    if (siteId) this.assertSiteAccess(ctx.scope, String(siteId));
    return this.clean({
      companyId: ctx.tenantId,
      siteId,
      unitId: dto.unitId ?? dto.unit_id ?? null,
      equipmentId: dto.equipmentId ?? dto.equipment_id ?? null,
      moduleKey: dto.moduleKey ?? dto.module_key ?? null,
      scopeType: dto.scopeType ?? dto.scope_type ?? 'Site',
      filters: dto.filters ?? {}
    });
  }

  private siteFromDto(scope: SiteScope, dto: Record<string, any>) {
    const siteId = dto.siteId ?? dto.site_id ?? this.selectedSite(scope);
    if (siteId) return this.assertSiteAccess(scope, String(siteId));
    return null;
  }

  private applyScope(query: any, scope: SiteScope, column = 'site_id') {
    if (scope.corporateView) return query;
    if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId);
    if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds);
    return query;
  }

  private assertSiteAccess(scope: SiteScope, siteId: string) {
    if (!siteId) throw new BadRequestException('Site is required for this PSI report scope.');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Selected site is outside your site access.');
    return siteId;
  }

  private selectedSite(scope: SiteScope) {
    return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null;
  }

  private assertScopePermission(ctx: PsiReportContext, scopeType: string) {
    if (scopeType === 'Company') this.requirePermission(ctx, 'psi.report.generate.company');
    if (scopeType === 'Site') this.requirePermission(ctx, 'psi.report.generate.site');
    if (scopeType === 'Unit') this.requirePermission(ctx, 'psi.report.generate.unit');
  }

  private requirePermission(ctx: PsiReportContext, permission: string) {
    if (!this.has(ctx, permission)) throw new ForbiddenException(`Missing permission: ${permission}`);
  }

  private has(ctx: PsiReportContext, permission: string) {
    const permissions = ctx.permissions ?? [];
    return permissions.includes(permission) || permissions.includes('psi:manage') || permissions.includes('psi.report.generate.company') || permissions.includes('tenants:manage');
  }

  private async nextNumber(tenantId: string, prefix: string, table: string, column: string) {
    const rows = await this.safeMany<any>(this.db.from(table).select(column).eq('company_id', tenantId).order('created_at', { ascending: false }).limit(1));
    const last = String(rows[0]?.[column] ?? '');
    const seq = Number(last.split('-').pop()) || rows.length;
    return `${prefix}-${new Date().getFullYear()}-${String(seq + 1).padStart(6, '0')}`;
  }

  private defaultModulesFor(reportType: string) {
    const lowered = reportType.toLowerCase();
    if (lowered.includes('chemical') || lowered.includes('sds')) return ['chemicals', 'documents'];
    if (lowered.includes('drawing') || lowered.includes('tag')) return ['drawings', 'documents'];
    if (lowered.includes('relief')) return ['relief-systems', 'equipment-design', 'documents'];
    if (lowered.includes('equipment')) return ['equipment-design', 'relief-systems', 'drawings', 'material-compatibility', 'safeguards'];
    if (lowered.includes('audit') || lowered.includes('evidence')) return ['completeness', 'review-approval', 'documents', 'integrations'];
    return ['units', 'completeness', 'review-approval', 'documents', 'integrations'];
  }

  private categoryFor(reportType: string) {
    if (reportType.includes('Package') || reportType.includes('Compliance') || reportType.includes('Evidence')) return 'Audit / Compliance';
    if (reportType.includes('Technical') || reportType.includes('Design') || reportType.includes('Chemical')) return 'Engineering';
    if (reportType.includes('Report') && !reportType.includes('Summary')) return 'Module Specific';
    return 'Management';
  }

  private packageTypeFor(scopeType: string) {
    if (scopeType === 'Unit') return 'Unit PSI Package';
    if (scopeType === 'Equipment') return 'Equipment PSI Package';
    return 'Full Site PSI Package';
  }

  private page(query: Record<string, any>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const from = (page - 1) * limit;
    return { page, limit, from, to: from + limit - 1 };
  }

  private extension(format: string) {
    const normalized = format.toLowerCase();
    if (normalized.includes('zip')) return 'zip';
    if (normalized.includes('excel') || normalized.includes('xlsx')) return 'xlsx';
    if (normalized.includes('csv')) return 'csv';
    if (normalized.includes('json')) return 'json';
    return 'pdf';
  }

  private slug(value: string) {
    return String(value ?? 'psi-report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'psi-report';
  }

  private arrayJson(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {
        return value.split(',').map((entry) => entry.trim()).filter(Boolean);
      }
    }
    return [];
  }

  private required(value: unknown, message: string) {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message);
    return value.trim();
  }

  private clean<T extends Record<string, any>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
  }

  private async safeSingle<T>(query: PromiseLike<any>) {
    try { return await this.db.single<T>(query); } catch { return null; }
  }

  private async safeMany<T>(query: PromiseLike<any>) {
    try { return await this.db.many<T>(query); } catch { return []; }
  }

  private async requireRow<T>(query: PromiseLike<T>, message: string): Promise<T> {
    try {
      const row = await query;
      if (!row) throw new Error(message);
      return row;
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : message);
    }
  }

  private async writeHistory(ctx: PsiReportContext, eventType: string, recordType: string, recordId: string | null, before: any, after: any, siteId: string | null, title: string, description?: string | null) {
    const auditInput: { tenantId: string; actorId: string; action: string; entityType: string; entityId?: string; before: JsonValue; after: JsonValue; metadata: JsonValue } = {
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      action: eventType,
      entityType: recordType,
      before: before as JsonValue,
      after: after as JsonValue,
      metadata: { siteId, source: 'PSI Reports / Export' } as JsonValue
    };
    if (recordId) auditInput.entityId = recordId;
    const audit = await this.audit.write(auditInput).catch(() => null);
    await this.safeSingle(this.db.from('psi_report_history_events').insert({
      id: randomUUID(),
      company_id: ctx.tenantId,
      site_id: siteId,
      related_record_type: recordType,
      related_record_id: recordId,
      event_type: eventType,
      event_title: title,
      event_description: description ?? null,
      before_values_json: before ?? null,
      after_values_json: after ?? null,
      metadata_json: { source: 'PSI Reports / Export' },
      actor_user_id: ctx.actorId,
      audit_log_id: (audit as any)?.id ?? null,
      correlation_id: randomUUID(),
      created_at: new Date().toISOString()
    }).select().single());
  }
}

export class PsiReportDashboardService extends PsiReportService {}
export class PsiReportTemplateService extends PsiReportService {}
export class PsiReportBuilderService extends PsiReportService {}
export class PsiReportGenerationService extends PsiReportService {}
export class PsiReportRenderService extends PsiReportService {}
export class PsiReportFileService extends PsiReportService {}
export class PsiReportDownloadService extends PsiReportService {}
export class PsiReportHistoryService extends PsiReportService {}
export class PsiReportAuditService extends PsiReportService {}
export class PsiReportPermissionService extends PsiReportService {}
export class PsiReportTenantScopeService extends PsiReportService {}
export class PsiReportSettingsService extends PsiReportService {}
export class PsiExportService extends PsiReportService {}
export class PsiExportJobService extends PsiReportService {}
export class PsiExportPackageService extends PsiReportService {}
export class PsiExportManifestService extends PsiReportService {}
export class PsiExportDocumentCollectorService extends PsiReportService {}
export class PsiExportFileBundlerService extends PsiReportService {}
export class PsiExportZipService extends PsiReportService {}
export class PsiExportPermissionFilterService extends PsiReportService {}
export class PsiReportDataCollectorService extends PsiReportService {}
export class PsiReportCompletenessDataService extends PsiReportService {}
export class PsiReportGapDataService extends PsiReportService {}
export class PsiReportDocumentDataService extends PsiReportService {}
export class PsiReportApprovalDataService extends PsiReportService {}
export class PsiReportIntegrationDataService extends PsiReportService {}
export class PsiReportAuditDataService extends PsiReportService {}
export class PsiReportChemicalAdapterService extends PsiReportService {}
export class PsiReportProcessChemistryAdapterService extends PsiReportService {}
export class PsiReportSafeOperatingLimitAdapterService extends PsiReportService {}
export class PsiReportEquipmentDesignAdapterService extends PsiReportService {}
export class PsiReportReliefSystemAdapterService extends PsiReportService {}
export class PsiReportDrawingAdapterService extends PsiReportService {}
export class PsiReportElectricalClassificationAdapterService extends PsiReportService {}
export class PsiReportMaterialCompatibilityAdapterService extends PsiReportService {}
export class PsiReportSafeguardAdapterService extends PsiReportService {}
export class PsiReportPdfRendererService extends PsiReportService {}
export class PsiReportExcelRendererService extends PsiReportService {}
export class PsiReportCsvRendererService extends PsiReportService {}
export class PsiReportJsonRendererService extends PsiReportService {}
export class PsiScheduledReportService extends PsiReportService {}
export class PsiScheduledReportRunnerService extends PsiReportService {}
export class PsiScheduledReportNotificationService extends PsiReportService {}
export class PsiReportDocumentControlAdapterService extends PsiReportService {}
export class PsiReportStorageAdapterService extends PsiReportService {}
export class PsiReportNotificationAdapterService extends PsiReportService {}
