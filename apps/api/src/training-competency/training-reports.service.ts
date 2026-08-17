import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

const reportTypes = ['Executive Summary', 'Workforce', 'Training Matrix', 'Competency', 'Required Training', 'Training Records', 'Certifications', 'Assessments', 'SOP Acknowledgements', 'MOC Training', 'PSSR Training', 'PTW Authorization', 'Gaps', 'Expiry / Overdue', 'Waivers', 'Audit Evidence', 'Worker Evidence Package'];
const formats = ['PDF', 'XLSX', 'CSV', 'JSON', 'ZIP'];
const reportStatuses = ['Preview', 'Queued', 'Generating', 'Generated', 'Generated With Warnings', 'Failed', 'Expired', 'Archived', 'Deleted', 'Restricted Approval Required'];
const jobStatuses = ['Queued', 'Running', 'Completed', 'Completed With Warnings', 'Failed', 'Cancelled', 'Retrying'];
const packageTypes = ['Audit Evidence Package', 'Worker Evidence Package', 'MOC Evidence Package', 'PSSR Evidence Package', 'PTW Authorization Evidence Package', 'Site Evidence Package', 'Executive Evidence Package'];
const confidentialityLevels = ['Public', 'Internal', 'Confidential', 'Restricted'];
const frequencies = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'Custom'];
const sourceModules = ['Workforce', 'Training Matrix', 'Competency', 'Required Training', 'Training Records', 'Certifications', 'Assessments', 'SOP Acknowledgements', 'MOC Training', 'PSSR Training', 'PTW Authorization'];

const defaultTemplates: Array<[string, string, string, string]> = [
  ['EXEC-COMP', 'Executive Training Compliance Summary', 'Executive Summary', 'All Training'],
  ['SITE-COMP', 'Site Training Compliance Report', 'Site Compliance', 'All Training'],
  ['UNIT-COMP', 'Unit Training Compliance Report', 'Unit Compliance', 'All Training'],
  ['WORKFORCE-STATUS', 'Workforce Training Status Report', 'Workforce', 'Workforce'],
  ['WORKER-EVIDENCE', 'Worker Evidence Package', 'Worker Evidence Package', 'Workforce'],
  ['MATRIX-COMP', 'Training Matrix Compliance Report', 'Training Matrix', 'Training Matrix'],
  ['MATRIX-GAPS', 'Training Matrix Gap Register', 'Gaps', 'Training Matrix'],
  ['ROLE-COMP', 'Role & Competency Compliance Report', 'Competency', 'Competency'],
  ['COMP-GAPS', 'Competency Gap Register', 'Gaps', 'Competency'],
  ['REQ-LIB', 'Required Training Library Register', 'Required Training', 'Required Training'],
  ['REQ-EVIDENCE', 'Required Training Evidence Policy Report', 'Required Training', 'Required Training'],
  ['RECORDS-ATTENDANCE', 'Training Records & Attendance Report', 'Training Records', 'Training Records'],
  ['SESSION-ATTENDANCE', 'Session Attendance Sheet', 'Training Records', 'Training Records'],
  ['COMPLETION-RECORDS', 'Training Completion Records Report', 'Training Records', 'Training Records'],
  ['CERT-REGISTER', 'Certificate Register', 'Certifications', 'Certifications'],
  ['CERT-EXPIRY', 'Certificate Expiry Report', 'Expiry / Overdue', 'Certifications'],
  ['CERT-MISSING', 'Missing Certificate Report', 'Gaps', 'Certifications'],
  ['ASSESSMENT-LIB', 'Assessment Library Report', 'Assessments', 'Assessments'],
  ['ASSESSMENT-RESULTS', 'Assessment Results Report', 'Assessments', 'Assessments'],
  ['ASSESSMENT-FAILED', 'Failed Assessment Report', 'Assessments', 'Assessments'],
  ['SOP-ACK-REGISTER', 'SOP Acknowledgement Register', 'SOP Acknowledgements', 'SOP Acknowledgements'],
  ['SOP-ACK-GAPS', 'SOP Acknowledgement Gap Report', 'Gaps', 'SOP Acknowledgements'],
  ['MOC-READINESS', 'MOC Training Readiness Report', 'MOC Training', 'MOC Training'],
  ['MOC-EVIDENCE', 'MOC Training Evidence Package', 'MOC Training', 'MOC Training'],
  ['PSSR-READINESS', 'PSSR Training Readiness Report', 'PSSR Training', 'PSSR Training'],
  ['PSSR-EVIDENCE', 'PSSR Training Evidence Package', 'PSSR Training', 'PSSR Training'],
  ['PTW-AUTH', 'PTW Role Authorization Report', 'PTW Authorization', 'PTW Authorization'],
  ['PTW-EVIDENCE', 'PTW Authorization Evidence Package', 'PTW Authorization', 'PTW Authorization']
];

@Injectable()
export class TrainingReportsService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    await this.ensureDefaultTemplates(user);
    const [summary, templates, reports, jobs, packages, schedules, downloads, history] = await Promise.all([
      this.dashboardSummary(user, query),
      this.templates(user, { ...query, limit: 8 }),
      this.generated(user, { ...query, limit: 8 }),
      this.exportJobs(user, { ...query, limit: 8 }),
      this.packages(user, { ...query, limit: 8 }),
      this.scheduled(user, { ...query, limit: 8 }),
      this.downloads(user, { ...query, limit: 8 }),
      this.history(user, { ...query, limit: 8 })
    ]);
    const reportRows = await this.reportRows(user, query);
    return {
      header: { title: 'Training Reports / Export', subtitle: 'Audit-ready training compliance reports, exports, evidence packages, schedules and download history.', lastUpdated: new Date().toISOString() },
      summary,
      recentGeneratedReports: reports.rows,
      recentExportJobs: jobs.rows,
      failedExportJobs: (await this.exportJobs(user, { ...query, jobStatus: 'Failed', limit: 8 })).rows,
      scheduledReportPreview: schedules.rows,
      mostDownloadedReports: downloads.rows,
      auditEvidencePackages: packages.rows.filter((row) => row.package_type === 'Audit Evidence Package'),
      reportsByModule: this.countBy(reportRows, 'source_module'),
      reportsBySite: this.countBy(reportRows, 'site_id'),
      reportsByFormat: this.countBy(reportRows, 'export_format'),
      downloadActivity: downloads.rows,
      restrictedDataExports: reportRows.filter((row) => row.confidentiality_level === 'Restricted' || row.contains_restricted_documents),
      upcomingScheduledExports: schedules.rows.filter((row) => row.status === 'Active'),
      templatesPreview: templates.rows,
      recentHistory: history.rows
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const [reports, jobs, packages, schedules, downloads] = await Promise.all([this.reportRows(user, query), this.jobRows(user, query), this.packageRows(user, query), this.scheduleRows(user, query), this.downloadRows(user, query)]);
    return {
      generatedReports: reports.length,
      exportJobs: jobs.length,
      completedExports: jobs.filter((row) => ['Completed', 'Completed With Warnings'].includes(row.job_status)).length,
      failedExports: jobs.filter((row) => row.job_status === 'Failed').length,
      scheduledReports: schedules.length,
      auditEvidencePackages: packages.filter((row) => row.package_type === 'Audit Evidence Package').length,
      workerEvidencePackages: packages.filter((row) => row.package_type === 'Worker Evidence Package').length,
      mocEvidencePackages: packages.filter((row) => row.package_type === 'MOC Evidence Package').length,
      pssrEvidencePackages: packages.filter((row) => row.package_type === 'PSSR Evidence Package').length,
      ptwAuthorizationEvidencePackages: packages.filter((row) => row.package_type === 'PTW Authorization Evidence Package').length,
      reportsDownloaded: downloads.filter((row) => row.allowed).length,
      reportsPendingGeneration: reports.filter((row) => ['Queued', 'Generating'].includes(row.report_status)).length,
      reportsExpiredDeleted: reports.filter((row) => ['Expired', 'Deleted'].includes(row.report_status) || row.deleted_at).length,
      reportsWithRestrictedData: reports.filter((row) => row.confidentiality_level === 'Restricted' || row.contains_restricted_documents).length,
      reportsShared: downloads.length,
      lastExportGenerated: reports[0]?.generated_at ?? null,
      largestExportPackage: Math.max(0, ...packages.map((row) => Number(row.package_size_bytes ?? 0))),
      reportsRequiringAttention: jobs.filter((row) => row.job_status === 'Failed').length + reports.filter((row) => row.report_status === 'Restricted Approval Required').length
    };
  }

  async templates(user: RequestUser, query: Row = {}) {
    await this.ensureDefaultTemplates(user);
    const rows = this.filterRows(await this.templateRows(user, query), query, ['template_name', 'template_code', 'report_type', 'source_module']);
    return { ...this.paginate(rows, query), summary: this.countBy(rows, 'template_status') };
  }

  async createTemplate(user: RequestUser, dto: Row) {
    this.requireText(dto.templateName ?? dto.template_name, 'Template name is required.');
    this.requireText(dto.reportType ?? dto.report_type, 'Report type is required.');
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    if (siteId) this.assertSiteAccess(user, siteId);
    const id = randomUUID();
    const row = await this.db.single<Row>(this.db.from('training_report_templates').insert(this.compact({
      id,
      company_id: user.tenantId,
      site_id: siteId,
      template_code: dto.templateCode ?? dto.template_code ?? `TR-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`,
      template_name: dto.templateName ?? dto.template_name,
      report_type: dto.reportType ?? dto.report_type,
      source_module: dto.sourceModule ?? dto.source_module ?? 'All Training',
      description: dto.description,
      default_format: dto.defaultFormat ?? dto.default_format ?? 'PDF',
      supported_formats_json: dto.supportedFormats ?? dto.supported_formats_json ?? ['PDF', 'XLSX', 'CSV', 'JSON'],
      default_filters_json: dto.defaultFilters ?? dto.default_filters_json ?? {},
      included_sections_json: dto.includedSections ?? dto.included_sections_json ?? [],
      included_columns_json: dto.includedColumns ?? dto.included_columns_json ?? [],
      include_evidence_documents: dto.includeEvidenceDocuments ?? dto.include_evidence_documents ?? false,
      include_signatures: dto.includeSignatures ?? dto.include_signatures ?? false,
      include_audit_trail: dto.includeAuditTrail ?? dto.include_audit_trail ?? false,
      include_history: dto.includeHistory ?? dto.include_history ?? false,
      confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level ?? 'Internal',
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      template_status: dto.templateStatus ?? dto.template_status ?? 'Draft',
      next_review_due: dto.nextReviewDue ?? dto.next_review_due,
      system_template: false,
      created_by: user.id,
      updated_by: user.id
    })).select('*').single());
    await this.writeHistory(user, 'Template Created', `Training report template created: ${row.template_name}`, null, row, { template_id: row.id, site_id: row.site_id });
    return row;
  }

  async templateDetail(user: RequestUser, templateId: string) {
    const template = await this.assertTemplate(user, templateId);
    const [reports, jobs, schedules, history] = await Promise.all([this.reportRows(user, { templateId }), this.jobRows(user, { templateId }), this.scheduleRows(user, { templateId }), this.history(user, { templateId, limit: 20 })]);
    return { template, reports, jobs, schedules, history: history.rows };
  }

  async updateTemplate(user: RequestUser, templateId: string, dto: Row) {
    const before = await this.assertTemplate(user, templateId);
    const after = await this.db.single<Row>(this.db.from('training_report_templates').update(this.compact({
      template_name: dto.templateName ?? dto.template_name,
      report_type: dto.reportType ?? dto.report_type,
      source_module: dto.sourceModule ?? dto.source_module,
      description: dto.description,
      default_format: dto.defaultFormat ?? dto.default_format,
      supported_formats_json: dto.supportedFormats ?? dto.supported_formats_json,
      default_filters_json: dto.defaultFilters ?? dto.default_filters_json,
      included_sections_json: dto.includedSections ?? dto.included_sections_json,
      included_columns_json: dto.includedColumns ?? dto.included_columns_json,
      include_evidence_documents: dto.includeEvidenceDocuments ?? dto.include_evidence_documents,
      include_signatures: dto.includeSignatures ?? dto.include_signatures,
      include_audit_trail: dto.includeAuditTrail ?? dto.include_audit_trail,
      include_history: dto.includeHistory ?? dto.include_history,
      confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      template_status: dto.templateStatus ?? dto.template_status,
      next_review_due: dto.nextReviewDue ?? dto.next_review_due,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })).eq('company_id', user.tenantId).eq('id', templateId).select('*').single());
    await this.writeHistory(user, 'Template Updated', `Training report template updated: ${after.template_name}`, before, after, { template_id: templateId, site_id: after.site_id });
    return after;
  }

  async archiveTemplate(user: RequestUser, templateId: string, dto: Row = {}) {
    this.requireText(dto.reason ?? dto.archiveReason, 'Archive reason is required.');
    const before = await this.assertTemplate(user, templateId);
    const after = await this.db.single<Row>(this.db.from('training_report_templates').update({ template_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason ?? dto.archiveReason, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', templateId).select('*').single());
    await this.writeHistory(user, 'Template Archived', `Training report template archived: ${after.template_name}`, before, after, { template_id: templateId, site_id: after.site_id });
    return after;
  }

  async reactivateTemplate(user: RequestUser, templateId: string) { return this.templateStatus(user, templateId, 'Draft', 'Template Reactivated'); }
  async activateTemplate(user: RequestUser, templateId: string) { return this.templateStatus(user, templateId, 'Active', 'Template Activated'); }

  async newVersion(user: RequestUser, templateId: string) {
    const before = await this.assertTemplate(user, templateId);
    const id = randomUUID();
    const clone = { ...before, id, version: Number(before.version ?? 1) + 1, template_status: 'Draft', system_template: false, archived_at: null, archived_by: null, archive_reason: null, created_by: user.id, updated_by: user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const row = await this.db.single<Row>(this.db.from('training_report_templates').insert(clone).select('*').single());
    await this.writeHistory(user, 'Template Version Created', `New training report template version created: ${row.template_name}`, before, row, { template_id: row.id, site_id: row.site_id });
    return row;
  }

  async preview(user: RequestUser, dto: Row = {}) {
    this.requireText(dto.reportType ?? dto.report_type, 'Report type is required.');
    this.validateScope(user, dto);
    const rows = await this.sourceRows(user, dto.reportType ?? dto.report_type, dto);
    return {
      reportType: dto.reportType ?? dto.report_type,
      sourceModule: dto.sourceModule ?? dto.source_module ?? this.sourceModuleFor(dto.reportType ?? dto.report_type),
      rowCount: rows.length,
      rows: rows.slice(0, 50),
      summary: this.previewSummary(rows),
      metadata: this.metadata(user, dto),
      restrictedDataWarning: rows.some((row) => row.confidentiality_level === 'Restricted')
    };
  }

  async generate(user: RequestUser, dto: Row = {}) {
    const preview = await this.preview(user, dto);
    const report = await this.insertGeneratedReport(user, dto, preview, dto.reportStatus ?? 'Generated');
    await this.writeHistory(user, 'Report Generated', `Training report generated: ${report.report_title}`, null, report, { generated_report_id: report.id, site_id: report.site_id });
    return { report, preview };
  }

  async exportReport(user: RequestUser, dto: Row = {}) {
    const format = String(dto.exportFormat ?? dto.export_format ?? 'PDF').toUpperCase();
    this.assertFormatAllowed(format);
    const job = await this.db.single<Row>(this.db.from('training_export_jobs').insert(this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      job_title: dto.jobTitle ?? dto.job_title ?? `${dto.reportType ?? 'Training'} ${format} Export`,
      report_type: dto.reportType ?? dto.report_type ?? 'Executive Summary',
      source_module: dto.sourceModule ?? dto.source_module ?? this.sourceModuleFor(dto.reportType ?? dto.report_type),
      source_record_id: dto.sourceRecordId ?? dto.source_record_id,
      template_id: dto.templateId ?? dto.template_id,
      requested_by: user.id,
      job_status: 'Completed',
      export_format: format,
      filters_json: dto.filters ?? dto.filters_json ?? {},
      scope_json: dto.scope ?? dto.scope_json ?? {},
      progress_percent: 100,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    })).select('*').single());
    const generated = await this.insertGeneratedReport(user, dto, await this.preview(user, dto), 'Generated');
    const file = await this.createFile(user, generated, job, format);
    const after = await this.db.single<Row>(this.db.from('training_export_jobs').update({ generated_report_id: generated.id, output_file_id: file.id, result_summary_json: { reportId: generated.id, fileId: file.id }, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', job.id).select('*').single());
    await this.writeHistory(user, 'Export Completed', `Training report export completed: ${after.job_title}`, null, after, { export_job_id: after.id, generated_report_id: generated.id, site_id: after.site_id });
    return { job: after, report: generated, file };
  }

  async generated(user: RequestUser, query: Row = {}) { const rows = this.filterRows(await this.reportRows(user, query), query, ['report_title', 'report_type', 'source_module', 'export_format']); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'report_status') }; }
  async generatedDetail(user: RequestUser, reportId: string) {
    const report = await this.assertReport(user, reportId);
    const [files, downloads, history] = await Promise.all([this.files(user, reportId), this.downloadRows(user, { reportId }), this.history(user, { reportId, limit: 20 })]);
    return { report, files, downloads, history: history.rows };
  }
  files(user: RequestUser, reportId: string) { return this.safeMany<Row>(this.db.from('training_report_files').select('*').eq('company_id', user.tenantId).eq('generated_report_id', reportId).order('created_at', { ascending: false })); }
  async archiveGenerated(user: RequestUser, reportId: string, dto: Row = {}) { const before = await this.assertReport(user, reportId); const after = await this.db.single<Row>(this.db.from('training_generated_reports').update({ report_status: 'Archived', delete_reason: dto.reason ?? null, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', reportId).select('*').single()); await this.writeHistory(user, 'Report Archived', `Training report archived: ${after.report_title}`, before, after, { generated_report_id: reportId, site_id: after.site_id }); return after; }
  async deleteGenerated(user: RequestUser, reportId: string, dto: Row = {}) { const before = await this.assertReport(user, reportId); const after = await this.db.single<Row>(this.db.from('training_generated_reports').update({ report_status: 'Deleted', deleted_at: new Date().toISOString(), deleted_by: user.id, delete_reason: dto.reason ?? 'Deleted by user', updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', reportId).select('*').single()); await this.writeHistory(user, 'Report Deleted', `Training report deleted: ${after.report_title}`, before, after, { generated_report_id: reportId, site_id: after.site_id }); return after; }

  async exportJobs(user: RequestUser, query: Row = {}) { const rows = this.filterRows(await this.jobRows(user, query), query, ['job_title', 'report_type', 'source_module', 'job_status']); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'job_status') }; }
  async exportJobDetail(user: RequestUser, jobId: string) { const job = await this.assertJob(user, jobId); const history = await this.history(user, { exportJobId: jobId, limit: 20 }); return { job, history: history.rows }; }
  async retryJob(user: RequestUser, jobId: string) { const before = await this.assertJob(user, jobId); const after = await this.db.single<Row>(this.db.from('training_export_jobs').update({ job_status: 'Retrying', retry_count: Number(before.retry_count ?? 0) + 1, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', jobId).select('*').single()); await this.writeHistory(user, 'Export Retried', `Training export job retried: ${after.job_title}`, before, after, { export_job_id: jobId, site_id: after.site_id }); return after; }
  async cancelJob(user: RequestUser, jobId: string) { const before = await this.assertJob(user, jobId); const after = await this.db.single<Row>(this.db.from('training_export_jobs').update({ job_status: 'Cancelled', updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', jobId).select('*').single()); await this.writeHistory(user, 'Export Cancelled', `Training export job cancelled: ${after.job_title}`, before, after, { export_job_id: jobId, site_id: after.site_id }); return after; }
  async deleteJob(user: RequestUser, jobId: string) { const before = await this.assertJob(user, jobId); const after = await this.db.single<Row>(this.db.from('training_export_jobs').update({ job_status: 'Deleted', updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', jobId).select('*').single()); await this.writeHistory(user, 'Export Deleted', `Training export job deleted: ${after.job_title}`, before, after, { export_job_id: jobId, site_id: after.site_id }); return after; }

  async packages(user: RequestUser, query: Row = {}) { const rows = this.filterRows(await this.packageRows(user, query), query, ['package_title', 'package_type', 'source_module', 'package_status']); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'package_status') }; }
  async createPackage(user: RequestUser, dto: Row = {}) {
    const generated = dto.generatedReportId || dto.generated_report_id ? await this.assertReport(user, dto.generatedReportId ?? dto.generated_report_id) : null;
    const id = randomUUID();
    const manifest = { generatedAt: new Date().toISOString(), included: [], excluded: [], scope: dto.scope ?? {}, filters: dto.filters ?? {}, note: 'Evidence manifest generated by Training Reports backend. Evidence files are referenced through storage/document-control adapters only.' };
    const row = await this.db.single<Row>(this.db.from('training_export_packages').insert(this.compact({
      id,
      company_id: user.tenantId,
      site_id: dto.siteId ?? dto.site_id ?? generated?.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null,
      unit_id: dto.unitId ?? dto.unit_id ?? generated?.unit_id,
      area_id: dto.areaId ?? dto.area_id ?? generated?.area_id,
      package_code: dto.packageCode ?? dto.package_code ?? `TR-PKG-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`,
      package_title: dto.packageTitle ?? dto.package_title ?? generated?.report_title ?? 'Training Evidence Package',
      package_type: dto.packageType ?? dto.package_type ?? 'Audit Evidence Package',
      source_module: dto.sourceModule ?? dto.source_module ?? generated?.source_module,
      source_record_id: dto.sourceRecordId ?? dto.source_record_id,
      generated_report_id: generated?.id,
      generated_by: user.id,
      package_status: 'Generated',
      manifest_json: manifest,
      confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level ?? generated?.confidentiality_level ?? 'Internal'
    })).select('*').single());
    await this.writeHistory(user, 'Package Created', `Training evidence package created: ${row.package_title}`, null, row, { package_id: row.id, generated_report_id: generated?.id, site_id: row.site_id });
    return row;
  }
  async packageDetail(user: RequestUser, packageId: string) { const pkg = await this.assertPackage(user, packageId); const items = await this.safeMany<Row>(this.db.from('training_export_package_items').select('*').eq('company_id', user.tenantId).eq('package_id', packageId)); const history = await this.history(user, { packageId, limit: 20 }); return { package: pkg, items, history: history.rows }; }
  regeneratePackage(user: RequestUser, packageId: string) { return this.packageDetail(user, packageId); }

  async scheduled(user: RequestUser, query: Row = {}) { const rows = this.filterRows(await this.scheduleRows(user, query), query, ['schedule_title', 'report_type', 'source_module', 'status']); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'status') }; }
  async createScheduled(user: RequestUser, dto: Row) {
    this.requireText(dto.scheduleTitle ?? dto.schedule_title, 'Schedule title is required.');
    this.requireText(dto.templateId ?? dto.template_id, 'Template is required.');
    const template = await this.assertTemplate(user, dto.templateId ?? dto.template_id);
    const row = await this.db.single<Row>(this.db.from('training_scheduled_reports').insert(this.compact({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ?? dto.site_id ?? template.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      schedule_title: dto.scheduleTitle ?? dto.schedule_title,
      template_id: template.id,
      report_type: dto.reportType ?? dto.report_type ?? template.report_type,
      source_module: dto.sourceModule ?? dto.source_module ?? template.source_module,
      scope_json: dto.scope ?? dto.scope_json ?? {},
      filters_json: dto.filters ?? dto.filters_json ?? {},
      export_format: dto.exportFormat ?? dto.export_format ?? template.default_format,
      delivery_method: dto.deliveryMethod ?? dto.delivery_method ?? 'Download',
      recipients_json: dto.recipients ?? dto.recipients_json ?? [],
      frequency: dto.frequency ?? 'Monthly',
      schedule_rule_json: dto.scheduleRule ?? dto.schedule_rule_json ?? {},
      next_run_at: dto.nextRunAt ?? dto.next_run_at,
      status: 'Active',
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? user.id,
      created_by: user.id,
      updated_by: user.id
    })).select('*').single());
    await this.writeHistory(user, 'Schedule Created', `Scheduled training report created: ${row.schedule_title}`, null, row, { scheduled_report_id: row.id, site_id: row.site_id });
    return row;
  }
  async scheduledDetail(user: RequestUser, scheduledReportId: string) { const schedule = await this.assertSchedule(user, scheduledReportId); const history = await this.history(user, { scheduledReportId, limit: 20 }); return { schedule, history: history.rows }; }
  async updateScheduled(user: RequestUser, scheduledReportId: string, dto: Row) { const before = await this.assertSchedule(user, scheduledReportId); const after = await this.db.single<Row>(this.db.from('training_scheduled_reports').update(this.compact({ schedule_title: dto.scheduleTitle ?? dto.schedule_title, recipients_json: dto.recipients ?? dto.recipients_json, frequency: dto.frequency, next_run_at: dto.nextRunAt ?? dto.next_run_at, status: dto.status, updated_by: user.id, updated_at: new Date().toISOString() })).eq('company_id', user.tenantId).eq('id', scheduledReportId).select('*').single()); await this.writeHistory(user, 'Schedule Updated', `Scheduled training report updated: ${after.schedule_title}`, before, after, { scheduled_report_id: scheduledReportId, site_id: after.site_id }); return after; }
  runScheduledNow(user: RequestUser, scheduledReportId: string) { return this.assertSchedule(user, scheduledReportId).then((schedule) => this.exportReport(user, { templateId: schedule.template_id, reportType: schedule.report_type, sourceModule: schedule.source_module, exportFormat: schedule.export_format, filters: schedule.filters_json, scope: schedule.scope_json })); }
  scheduledStatus(user: RequestUser, scheduledReportId: string, status: string) { return this.updateScheduled(user, scheduledReportId, { status }); }

  async downloads(user: RequestUser, query: Row = {}) { const rows = await this.downloadRows(user, query); return { ...this.paginate(rows, query), summary: this.countBy(rows, 'allowed') }; }
  async downloadFile(user: RequestUser, fileId: string) { const file = await this.assertFile(user, fileId); return this.recordDownload(user, { file, generatedReportId: file.generated_report_id, reportFileId: file.id, allowed: file.download_allowed, deniedReason: file.download_allowed ? null : 'Download is blocked by report file policy.' }); }
  async downloadPackage(user: RequestUser, packageId: string) { const pkg = await this.assertPackage(user, packageId); return this.recordDownload(user, { package: pkg, packageId: pkg.id, allowed: true }); }

  auditEvidence(user: RequestUser, query: Row = {}) { return this.packages(user, { ...query, packageType: 'Audit Evidence Package' }); }
  workerReports(user: RequestUser, workerId: string, query: Row = {}) { return this.generated(user, { ...query, workerId }); }
  workerEvidencePackage(user: RequestUser, workerId: string) { return this.createPackage(user, { packageTitle: `Worker Evidence Package - ${workerId}`, packageType: 'Worker Evidence Package', sourceModule: 'Workforce', sourceRecordId: workerId }); }
  mocEvidencePackage(user: RequestUser, mocId: string) { return this.createPackage(user, { packageTitle: `MOC Training Evidence Package - ${mocId}`, packageType: 'MOC Evidence Package', sourceModule: 'MOC Training', sourceRecordId: mocId }); }
  pssrEvidencePackage(user: RequestUser, pssrId: string) { return this.createPackage(user, { packageTitle: `PSSR Training Evidence Package - ${pssrId}`, packageType: 'PSSR Evidence Package', sourceModule: 'PSSR Training', sourceRecordId: pssrId }); }
  ptwEvidencePackage(user: RequestUser, permitId: string) { return this.createPackage(user, { packageTitle: `PTW Authorization Evidence Package - ${permitId}`, packageType: 'PTW Authorization Evidence Package', sourceModule: 'PTW Authorization', sourceRecordId: permitId }); }
  scoped(user: RequestUser, scope: 'site' | 'unit' | 'area', id: string) { const query: Row = scope === 'site' ? { siteId: id } : scope === 'unit' ? { unitId: id } : { areaId: id }; return this.generated(user, query); }
  reportView(user: RequestUser, reportType: string, query: Row = {}) { return this.preview(user, { ...query, reportType }); }
  history(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_report_history_events').select('*').eq('company_id', user.tenantId);
    req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id');
    if (query.templateId) req = req.eq('template_id', query.templateId);
    if (query.reportId) req = req.eq('generated_report_id', query.reportId);
    if (query.exportJobId) req = req.eq('export_job_id', query.exportJobId);
    if (query.packageId) req = req.eq('package_id', query.packageId);
    if (query.scheduledReportId) req = req.eq('scheduled_report_id', query.scheduledReportId);
    return this.safeMany<Row>(req.order('created_at', { ascending: false })).then((rows) => this.paginate(rows, query));
  }
  async settings(user: RequestUser, query: Row = {}) { const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null; if (siteId) this.assertSiteAccess(user, siteId); const rows = await this.safeMany<Row>(this.db.from('training_report_settings').select('*').eq('company_id', user.tenantId).eq('site_id', siteId)); return rows[0] ?? { company_id: user.tenantId, site_id: siteId, default_export_format: 'PDF', default_confidentiality_level: 'Internal', default_report_expiry_days: 30, allow_pdf_export: true, allow_xlsx_export: true, allow_csv_export: true, allow_json_export: true, allow_zip_evidence_packages: true, require_audit_event_on_download: true, require_manifest_for_evidence_packages: true, allow_scheduled_reports: true }; }
  async updateSettings(user: RequestUser, dto: Row) { const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null; if (siteId) this.assertSiteAccess(user, siteId); const before = await this.settings(user, { siteId }); const row = await this.db.single<Row>(this.db.from('training_report_settings').upsert(this.compact({ id: before.id ?? randomUUID(), company_id: user.tenantId, site_id: siteId, ...dto, updated_by: user.id, updated_at: new Date().toISOString() }), { onConflict: 'company_id,site_id' }).select('*').single()); await this.writeHistory(user, 'Settings Updated', 'Training report settings updated', before, row, { site_id: siteId }); return row; }
  lookups(name?: string) { const all = { trainingReportTypes: reportTypes, trainingReportFormats: formats, trainingReportStatuses: reportStatuses, trainingExportJobStatuses: jobStatuses, trainingPackageTypes: packageTypes, trainingConfidentialityLevels: confidentialityLevels, trainingScheduledReportFrequencies: frequencies, trainingSourceModules: sourceModules }; return name ? { values: (all as Row)[name] ?? [] } : all; }

  private async ensureDefaultTemplates(user: RequestUser) {
    const existing = await this.safeMany<Row>(this.db.from('training_report_templates').select('id').eq('company_id', user.tenantId).eq('system_template', true).limit(1));
    if (existing.length) return;
    for (const [code, name, type, module] of defaultTemplates) {
      await this.db.single(this.db.from('training_report_templates').insert({ id: randomUUID(), company_id: user.tenantId, template_code: code, template_name: name, report_type: type, source_module: module, default_format: type.includes('Package') ? 'ZIP' : 'PDF', supported_formats_json: type.includes('Package') ? ['ZIP', 'PDF'] : ['PDF', 'XLSX', 'CSV', 'JSON'], included_sections_json: ['Summary', 'Register', 'Gaps', 'Evidence', 'History'], included_columns_json: [], include_evidence_documents: type.includes('Package'), include_history: true, confidentiality_level: 'Internal', template_status: 'Active', system_template: true, created_by: user.id, updated_by: user.id }).select('id').single()).catch(() => null);
    }
  }
  private async insertGeneratedReport(user: RequestUser, dto: Row, preview: Row, status: string) { const id = randomUUID(); const report = await this.db.single<Row>(this.db.from('training_generated_reports').insert(this.compact({ id, company_id: user.tenantId, site_id: dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null, unit_id: dto.unitId ?? dto.unit_id, area_id: dto.areaId ?? dto.area_id, report_code: `TR-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`, report_title: dto.reportTitle ?? dto.report_title ?? `${preview.reportType} Report`, report_type: preview.reportType, source_module: preview.sourceModule, source_record_id: dto.sourceRecordId ?? dto.source_record_id, template_id: dto.templateId ?? dto.template_id, generated_by: user.id, report_status: status, export_format: dto.exportFormat ?? dto.export_format ?? 'PDF', filters_json: dto.filters ?? dto.filters_json ?? {}, scope_json: dto.scope ?? dto.scope_json ?? {}, summary_json: preview.summary, row_count: preview.rowCount, confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level ?? 'Internal', contains_worker_data: true, contains_certificate_data: ['Certifications', 'Expiry / Overdue'].includes(preview.reportType), contains_assessment_data: preview.reportType === 'Assessments', contains_restricted_documents: false, expires_at: this.expiryDate(30) })).select('*').single()); return report; }
  private async createFile(user: RequestUser, report: Row, job: Row, format: string) { return this.db.single<Row>(this.db.from('training_report_files').insert({ id: randomUUID(), company_id: user.tenantId, site_id: report.site_id, generated_report_id: report.id, export_job_id: job.id, file_name: `${report.report_code}.${format.toLowerCase()}`, file_type: 'Report', file_format: format, file_size_bytes: 0, storage_key: null, confidentiality_level: report.confidentiality_level, download_allowed: true, expires_at: report.expires_at, created_by: user.id }).select('*').single()); }
  private async recordDownload(user: RequestUser, data: Row) { const event = await this.db.single<Row>(this.db.from('training_report_download_events').insert({ id: randomUUID(), company_id: user.tenantId, site_id: data.file?.site_id ?? data.package?.site_id ?? null, generated_report_id: data.generatedReportId ?? null, report_file_id: data.reportFileId ?? null, package_id: data.packageId ?? null, downloaded_by: user.id, download_method: 'Signed URL / Controlled Download', allowed: data.allowed, denied_reason: data.deniedReason ?? null, confidentiality_level: data.file?.confidentiality_level ?? data.package?.confidentiality_level ?? 'Internal' }).select('*').single()); await this.writeHistory(user, data.allowed ? 'Downloaded' : 'Download Denied', data.allowed ? 'Training report download allowed' : data.deniedReason, null, event, { generated_report_id: data.generatedReportId, package_id: data.packageId, site_id: event.site_id }); return { allowed: data.allowed, download: event, url: data.allowed ? null : undefined, message: data.allowed ? 'Download event recorded. Storage adapter can issue a signed URL for this file.' : data.deniedReason }; }
  private async sourceRows(user: RequestUser, reportType: string, dto: Row = {}) { const table = this.tableFor(reportType); if (!table) return []; let req: any = this.db.from(table).select('*').eq('company_id', user.tenantId); req = dto.siteId ? req.eq(this.siteColumn(table), this.assertSiteAccess(user, dto.siteId)) : this.siteScopedBase(user, req, this.siteColumn(table)); if (dto.workerId) req = req.eq('worker_id', dto.workerId); return this.safeMany<Row>(req.limit(500)); }
  private tableFor(reportType: string) { const key = String(reportType).toLowerCase(); if (key.includes('workforce') || key.includes('worker')) return 'training_workers'; if (key.includes('matrix') || key.includes('gap')) return 'training_matrix_gaps'; if (key.includes('competency')) return 'training_competency_profiles'; if (key.includes('required')) return 'training_required_items'; if (key.includes('record') || key.includes('attendance')) return 'training_completion_records'; if (key.includes('cert')) return 'training_worker_certificates'; if (key.includes('assessment')) return 'training_assessment_results'; if (key.includes('sop')) return 'training_sop_ack_assignments'; if (key.includes('moc')) return 'training_moc_assignments'; if (key.includes('pssr')) return 'training_pssr_assignments'; if (key.includes('ptw')) return 'training_ptw_authorizations'; return 'training_workers'; }
  private siteColumn(table: string) { return ['training_workers'].includes(table) ? 'primary_site_id' : 'site_id'; }
  private sourceModuleFor(reportType: string) { const match = sourceModules.find((module) => { const token = module.toLowerCase().split(' ')[0] ?? ''; return token ? String(reportType ?? '').toLowerCase().includes(token) : false; }); return match ?? 'All Training'; }
  private previewSummary(rows: Row[]) { return { totalRows: rows.length, byStatus: this.countBy(rows, 'status'), bySite: this.countBy(rows, 'site_id'), dataTimestamp: new Date().toISOString() }; }
  private metadata(user: RequestUser, dto: Row) { return { companyId: user.tenantId, generatedBy: user.id, generatedAt: new Date().toISOString(), filters: dto.filters ?? {}, scope: dto.scope ?? {}, reportVersion: 1, confidentialityLabel: dto.confidentialityLevel ?? 'Internal' }; }
  private validateScope(user: RequestUser, dto: Row) { const siteId = dto.siteId ?? dto.site_id ?? dto.scope?.siteId; if (siteId) this.assertSiteAccess(user, siteId); return true; }
  private assertFormatAllowed(format: string) { if (!formats.includes(format)) throw new BadRequestException(`Export format ${format} is not supported.`); }
  private expiryDate(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString(); }
  private async templateStatus(user: RequestUser, templateId: string, status: string, event: string) { const before = await this.assertTemplate(user, templateId); const after = await this.db.single<Row>(this.db.from('training_report_templates').update({ template_status: status, archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', templateId).select('*').single()); await this.writeHistory(user, event, `${event}: ${after.template_name}`, before, after, { template_id: templateId, site_id: after.site_id }); return after; }
  private async assertTemplate(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_report_templates').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Training report template was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); return row; }
  private async assertReport(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_generated_reports').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Generated training report was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); return row; }
  private async assertJob(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_export_jobs').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Training export job was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); return row; }
  private async assertPackage(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_export_packages').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Training evidence package was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); return row; }
  private async assertSchedule(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_scheduled_reports').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Scheduled training report was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); return row; }
  private async assertFile(user: RequestUser, id: string) { const row = await this.db.single<Row>(this.db.from('training_report_files').select('*').eq('company_id', user.tenantId).eq('id', id).single()); if (!row) throw new NotFoundException('Training report file was not found.'); if (row.site_id) this.assertSiteAccess(user, row.site_id); if (row.confidentiality_level === 'Restricted' && !(user.permissions ?? []).includes('training.reports.download.restricted')) throw new ForbiddenException('Restricted report download permission is required.'); return row; }
  private templateRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_report_templates').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id'); if (query.templateStatus) req = req.eq('template_status', query.templateStatus); if (query.reportType) req = req.eq('report_type', query.reportType); return this.safeMany<Row>(req.order('updated_at', { ascending: false })); }
  private reportRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_generated_reports').select('*').eq('company_id', user.tenantId).is('deleted_at', null); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id'); if (query.templateId) req = req.eq('template_id', query.templateId); if (query.reportType) req = req.eq('report_type', query.reportType); if (query.sourceModule) req = req.eq('source_module', query.sourceModule); return this.safeMany<Row>(req.order('generated_at', { ascending: false })); }
  private jobRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_export_jobs').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id'); if (query.templateId) req = req.eq('template_id', query.templateId); if (query.jobStatus) req = req.eq('job_status', query.jobStatus); return this.safeMany<Row>(req.order('created_at', { ascending: false })); }
  private packageRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_export_packages').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id'); if (query.packageType) req = req.eq('package_type', query.packageType); return this.safeMany<Row>(req.order('generated_at', { ascending: false })); }
  private scheduleRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_scheduled_reports').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id'); if (query.status) req = req.eq('status', query.status); if (query.templateId) req = req.eq('template_id', query.templateId); return this.safeMany<Row>(req.order('updated_at', { ascending: false })); }
  private downloadRows(user: RequestUser, query: Row = {}) { let req: any = this.db.from('training_report_download_events').select('*').eq('company_id', user.tenantId); req = query.siteId ? req.eq('site_id', this.assertSiteAccess(user, query.siteId)) : this.siteScopedBase(user, req, 'site_id'); if (query.reportId) req = req.eq('generated_report_id', query.reportId); return this.safeMany<Row>(req.order('downloaded_at', { ascending: false })); }
  private filterRows(rows: Row[], query: Row, fields: string[]) { const search = String(query.search ?? '').toLowerCase(); return search ? rows.filter((row) => fields.some((field) => String(row[field] ?? '').toLowerCase().includes(search))) : rows; }
  private scope(user: RequestUser) { return { allowedSiteIds: user.siteIds ?? [], selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null, corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) }; }
  private siteScopedBase(user: RequestUser, req: any, column = 'site_id') { const scope = this.scope(user); if (scope.selectedSiteId) return req.eq(column, this.assertSiteAccess(user, scope.selectedSiteId)); if (!scope.corporateView && scope.allowedSiteIds.length) return req.in(column, scope.allowedSiteIds); if (!scope.corporateView) return req.eq(column, '__no_site_access__'); return req; }
  private assertSiteAccess(user: RequestUser, siteId?: string | null) { if (!siteId) throw new BadRequestException('Site is required.'); const scope = this.scope(user); if (!scope.corporateView && scope.allowedSiteIds.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to the selected site.'); return siteId; }
  private async writeHistory(user: RequestUser, eventType: string, title: string, before: Row | null, after: Row | null, scope: Row = {}) { const history = { id: randomUUID(), company_id: user.tenantId, site_id: scope.site_id ?? after?.site_id ?? null, unit_id: scope.unit_id ?? after?.unit_id ?? null, area_id: scope.area_id ?? after?.area_id ?? null, generated_report_id: scope.generated_report_id ?? after?.generated_report_id ?? after?.id ?? null, template_id: scope.template_id ?? after?.template_id ?? null, export_job_id: scope.export_job_id ?? after?.export_job_id ?? null, package_id: scope.package_id ?? after?.package_id ?? null, scheduled_report_id: scope.scheduled_report_id ?? after?.scheduled_report_id ?? null, event_type: eventType, event_title: title, event_description: title, before_value_json: before, after_value_json: after, actor_user_id: user.id, source_module: scope.source_module ?? after?.source_module ?? 'Training Reports', source_record_id: scope.source_record_id ?? after?.id ?? null }; await this.db.single(this.db.from('training_report_history_events').insert(history).select('id').single()).catch(() => null); await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: `training.reports.${eventType.toLowerCase().replaceAll(' ', '_')}`, entityType: 'TrainingReport', entityId: history.source_record_id, before: before as JsonValue, after: after as JsonValue, metadata: { title } as JsonValue }).catch(() => null); }
  private countBy(rows: Row[], field: string) { return Object.entries(rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [String(row[field] ?? 'Unknown')]: (acc[String(row[field] ?? 'Unknown')] ?? 0) + 1 }), {})).map(([label, count]) => ({ label, count })); }
  private requireText(value: unknown, message: string) { if (!String(value ?? '').trim()) throw new BadRequestException(message); }
  private paginate(rows: Row[], query: Row = {}) { const page = Math.max(Number(query.page ?? 1), 1); const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 500); return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit, lastUpdated: new Date().toISOString() }; }
  private compact<T extends Row>(obj: T) { return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>; }
  private safeMany<T = Row>(query: PromiseLike<any>): Promise<T[]> { return this.db.many<T>(query).catch(() => []); }
}
