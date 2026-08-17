import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../notifications/notifications.service';

type Query = Record<string, string | undefined>;

const historyEventTypes = [
  'Equipment created','Equipment updated','Status changed','Technical data changed','Criticality changed','Readiness changed','Equipment archived/decommissioned',
  'CML/TML created/updated','UT reading added/approved/rejected','Remaining life recalculated','Inspection plan created/approved','Inspection completed','Inspection finding created','Inspection overdue','Next due recalculated',
  'PM plan created/approved','PM completed/failed','Calibration completed/failed','Calibration certificate linked','Overdue PM/calibration',
  'PSV created/updated','Protected equipment linked','PSV test completed/failed','PSV certificate linked','PSV overdue','Seal/car-seal changed',
  'SIF created/updated','Proof test completed/failed','Interlock test completed/failed','Critical alarm test completed/failed','Demand event recorded','Bypass/inhibit/override changed',
  'Bypass created/approved/activated/expired/restored','Deficiency created/approved/verified/closed','Deviation created/approved/expired/closed','Work order created/started/completed/verified/closed','Action assigned/completed/closed',
  'Readiness check run','Readiness assessment approved/rejected','Startup blocked/cleared','Approval submitted/approved/rejected/returned','Document linked/removed','Required document missing/resolved','Export/report generated'
];

const reportCategories: Record<string, string[]> = {
  Management: ['MI Executive Summary','Site Integrity Health Report','Critical Equipment Status Report','KPI / Trend Report','Open Risk Report','Overdue Items Report'],
  Equipment: ['Equipment Integrity File','Equipment Lifecycle Report','Equipment Readiness Report','Equipment History Report','Equipment Document Completeness Report'],
  'Inspection / CML': ['Inspection Due / Overdue Report','Inspection Completion Report','CML/TML Thickness Report','UT Reading Report','Remaining Life Report','Corrosion Rate Report','Low Remaining Life Report'],
  'PM / Calibration': ['PM Due / Overdue Report','PM Completion Report','Calibration Due / Overdue Report','Failed Calibration Report','Calibration Certificate Report'],
  'PSV / Relief': ['PSV Registry Report','PSV Due / Overdue Report','Failed PSV Test Report','PSV Certificate Report','Relief Protection Coverage Report','PSV Seal / Car-Seal Report'],
  'SIS / Safeguards': ['SIF Registry Report','Proof Test Due / Overdue Report','Failed Safeguard Test Report','Interlock Test Report','Critical Alarm Test Report','Active Bypass / Inhibit Report','LOPA/SIL Safeguard Report'],
  'Deficiency / Work': ['Open Deficiency Report','Critical Deficiency Report','Deviation Report','Expired Deviation Report','Work Order Status Report','Overdue Work Order Report','Corrective Action Report'],
  'Readiness / Approval': ['Fitness-for-Service Report','Startup Blocker Report','Readiness Assessment Report','Pending Approval Report','Approval Audit Report','E-Signature Report'],
  Documents: ['Required Document Report','Missing Document Report','Expired Certificate Report','Document Waiver Report']
};

const exportTypes = [
  'Equipment Integrity File','Equipment Complete Evidence Package','Site MI Data Export','Inspection Export','CML/TML Export','PM Export','Calibration Export','PSV Export','SIF/Safeguard Export','Bypass/Impairment Export','Deficiency/Deviation Export','Work Order Export','Readiness Export','Approval Export','Document Link Export','Audit/History Export'
];

const exportFormats = ['PDF','Excel','CSV','JSON','ZIP evidence package'];

const historySources = [
  { table: 'mi_history_event_views', module: 'History Adapter', recordField: 'source_record_id', numberField: 'source_record_number', timeField: 'event_at', actorField: 'actor_user_id' },
  { table: 'mi_equipment_history_events', module: 'Equipment', recordField: 'equipment_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_criticality_history_events', module: 'Criticality', recordField: 'assessment_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_pm_calibration_history_events', module: 'PM / Calibration', recordField: 'source_record_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_relief_device_history_events', module: 'PSV / Relief', recordField: 'relief_device_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_safeguard_history_events', module: 'SIS / Safeguards', recordField: 'source_record_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_safeguard_impairment_history_events', module: 'Bypass / Impairment', recordField: 'impairment_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_deficiency_history_events', module: 'Deficiency / Deviation', recordField: 'deficiency_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_work_order_history_events', module: 'Work Order', recordField: 'work_order_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_readiness_history_events', module: 'Readiness', recordField: 'assessment_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_linked_record_history_events', module: 'Linked Records / Documents', recordField: 'source_record_id', timeField: 'created_at', actorField: 'actor_user_id' },
  { table: 'mi_approval_history_events', module: 'Review & Approval', recordField: 'approval_instance_id', timeField: 'created_at', actorField: 'actor_user_id' }
];

@Injectable()
export class MiHistoryReportingService {
  constructor(
    private readonly db: SupabaseService,
    private readonly documents: DocumentsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService
  ) {}

  async historyDashboard(user: RequestUser, query: Query = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const events = await this.historyEvents(user, query);
    const total = events.length;
    const rows = events.slice((page - 1) * limit, page * limit);
    return {
      rows,
      page,
      limit,
      total,
      summary: this.historySummary(events),
      recentCriticalEvents: events.filter((event) => /critical|failed|overdue|expired|blocked/i.test(`${event.severity} ${event.eventType} ${event.eventTitle}`)).slice(0, 8),
      approvalHistory: events.filter((event) => /approval|approved|rejected|returned/i.test(`${event.sourceModule} ${event.eventType}`)).slice(0, 8),
      exportHistory: events.filter((event) => /export|report/i.test(`${event.sourceModule} ${event.eventType}`)).slice(0, 8),
      savedViews: ['All Events','Critical Events','Equipment Changes','Readiness Changes','Failed Tests','Deficiency Closures','Approval Events','Document Events','Export Events','User Activity','Today','This Week','This Month'],
      lastUpdated: new Date().toISOString()
    };
  }

  async historySummaryEndpoint(user: RequestUser, query: Query = {}) {
    return this.historySummary(await this.historyEvents(user, query));
  }

  async timeline(user: RequestUser, query: Query = {}) {
    const events = await this.historyEvents(user, query);
    const groups = events.reduce<Record<string, any[]>>((acc, event) => {
      const key = query.groupBy === 'module' ? event.sourceModule : query.groupBy === 'severity' ? event.severity : new Date(event.eventAt).toISOString().slice(0, 10);
      acc[key] = [...(acc[key] ?? []), event];
      return acc;
    }, {});
    return { groups, rows: events.slice(0, 250), groupBy: query.groupBy ?? 'date', lastUpdated: new Date().toISOString() };
  }

  async auditTrail(user: RequestUser, query: Query = {}) {
    return this.historyDashboard(user, { ...query, audit: 'true' });
  }

  async eventDetail(user: RequestUser, eventId: string) {
    const events = await this.historyEvents(user, { eventId });
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new NotFoundException('MI history event not found.');
    return { event, beforeAfter: { before: event.beforeValues ?? null, after: event.afterValues ?? null }, auditMetadata: { auditLogId: event.auditLogId ?? null, sourceTable: event.sourceTable } };
  }

  async equipmentHistory(user: RequestUser, equipmentId: string, query: Query = {}) {
    const equipment = await this.resolveEquipment(user, equipmentId);
    const rows = await this.historyEvents(user, { ...query, equipmentId });
    return {
      equipment,
      rows,
      summary: this.historySummary(rows),
      lifecycleTimeline: rows,
      integrityEvents: rows.filter((row) => /equipment|technical|criticality|readiness/i.test(row.sourceModule)),
      inspectionCmlTimeline: rows.filter((row) => /inspection|cml|tml|ut|remaining/i.test(row.sourceModule)),
      pmCalibrationTimeline: rows.filter((row) => /pm|calibration/i.test(row.sourceModule)),
      psvSifSafeguardTimeline: rows.filter((row) => /psv|relief|sif|sis|safeguard|interlock|alarm/i.test(row.sourceModule)),
      deficiencyWorkTimeline: rows.filter((row) => /deficiency|deviation|work/i.test(row.sourceModule)),
      readinessApprovalTimeline: rows.filter((row) => /readiness|approval/i.test(row.sourceModule)),
      documentTimeline: rows.filter((row) => /document|linked/i.test(row.sourceModule)),
      lastUpdated: new Date().toISOString()
    };
  }

  async equipmentHistoryExport(user: RequestUser, equipmentId: string) {
    const data = await this.equipmentHistory(user, equipmentId);
    await this.writeAudit(user, 'MI_EQUIPMENT_HISTORY_EXPORTED', 'MechanicalIntegrityHistory', equipmentId, null, data.summary);
    return { fileName: `mi-equipment-history-${equipmentId}.csv`, content: this.csv(data.rows, ['eventAt','eventType','eventTitle','sourceModule','sourceRecordId','equipmentId','severity','actorUserId']) };
  }

  async reportsDashboard(user: RequestUser, query: Query = {}) {
    const [templates, generated, scheduled] = await Promise.all([this.reportTemplates(user, query), this.generatedReports(user, query), this.scheduledReports(user, query)]);
    return {
      categories: Object.entries(reportCategories).map(([category, reports]) => ({ category, reports })),
      commonReports: Object.values(reportCategories).flat().slice(0, 16),
      templates,
      generated: generated.rows,
      scheduled: scheduled.rows,
      summary: {
        templates: templates.length,
        generatedReports: generated.rows.length,
        scheduledReports: scheduled.rows.length,
        failedReports: generated.rows.filter((row: any) => row.status === 'Failed').length
      },
      lastUpdated: new Date().toISOString()
    };
  }

  async reportTemplates(user: RequestUser, query: Query = {}) {
    let request = this.scope(this.db.from('mi_report_templates').select('*'), user, query, true);
    if (query.reportCategory) request = request.eq('report_category', query.reportCategory);
    if (query.reportType) request = request.eq('report_type', query.reportType);
    if (query.active !== 'false') request = request.eq('active', true);
    return this.db.many<any>(request.order('template_name')).catch(() => []);
  }

  async createReportTemplate(user: RequestUser, body: Record<string, any>) {
    const row = await this.db.single<any>(this.db.from('mi_report_templates').insert({
      company_id: user.tenantId,
      site_id: body.siteId ?? body.site_id ?? user.selectedSiteId ?? null,
      template_name: this.required(body.templateName ?? body.template_name, 'Report template name is required.'),
      report_category: this.required(body.reportCategory ?? body.report_category, 'Report category is required.'),
      report_type: this.required(body.reportType ?? body.report_type, 'Report type is required.'),
      description: body.description ?? null,
      config_json: body.config ?? body.config_json ?? {},
      output_formats_json: body.outputFormats ?? body.output_formats_json ?? ['PDF','Excel','CSV','JSON'],
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.historyEvent(user, row, 'REPORT_TEMPLATE_CREATED', 'MI report template created', null, row);
    return row;
  }

  async reportTemplate(user: RequestUser, templateId: string) {
    const row = await this.db.single<any>(this.scope(this.db.from('mi_report_templates').select('*').eq('id', templateId), user, {}, true).maybeSingle());
    if (!row) throw new NotFoundException('MI report template not found.');
    return row;
  }

  async updateReportTemplate(user: RequestUser, templateId: string, body: Record<string, any>) {
    const before = await this.reportTemplate(user, templateId);
    const patch: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() };
    if (body.templateName ?? body.template_name) patch.template_name = body.templateName ?? body.template_name;
    if (body.reportCategory ?? body.report_category) patch.report_category = body.reportCategory ?? body.report_category;
    if (body.reportType ?? body.report_type) patch.report_type = body.reportType ?? body.report_type;
    if (body.description !== undefined) patch.description = body.description;
    if (body.config ?? body.config_json) patch.config_json = body.config ?? body.config_json;
    if (body.outputFormats ?? body.output_formats_json) patch.output_formats_json = body.outputFormats ?? body.output_formats_json;
    const row = await this.db.single<any>(this.db.from('mi_report_templates').update(patch).eq('company_id', user.tenantId).eq('id', templateId).select().single());
    await this.historyEvent(user, row, 'REPORT_TEMPLATE_UPDATED', 'MI report template updated', before, row);
    return row;
  }

  async archiveReportTemplate(user: RequestUser, templateId: string) {
    const before = await this.reportTemplate(user, templateId);
    const row = await this.db.single<any>(this.db.from('mi_report_templates').update({ active: false, archived_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', templateId).select().single());
    await this.historyEvent(user, row, 'REPORT_TEMPLATE_ARCHIVED', 'MI report template archived', before, row);
    return row;
  }

  async generateReport(user: RequestUser, body: Record<string, any>) {
    const reportType = this.required(body.reportType ?? body.report_type, 'Report type is required.');
    const outputFormat = this.required(body.outputFormat ?? body.output_format, 'Output format is required.');
    this.assertFormat(outputFormat);
    this.assertDateRange(body);
    const filters = body.filters ?? body.filters_json ?? {};
    const rows = await this.reportRows(user, reportType, filters);
    const siteId = body.siteId ?? body.site_id ?? user.selectedSiteId ?? null;
    const row = await this.db.single<any>(this.db.from('mi_generated_reports').insert({
      company_id: user.tenantId,
      site_id: siteId,
      report_number: await this.nextNumber('MIRPT', user.tenantId, siteId, 'mi_generated_reports', 'report_number'),
      report_title: body.reportTitle ?? body.report_title ?? reportType,
      report_category: body.reportCategory ?? body.report_category ?? this.categoryFor(reportType),
      report_type: reportType,
      template_id: body.templateId ?? body.template_id ?? null,
      status: 'Generated',
      filters_json: filters,
      output_format: outputFormat,
      metadata_json: this.metadata(user, body.reportTitle ?? reportType, reportType, filters, rows.length),
      file_key: `mi/reports/${Date.now()}-${this.slug(reportType)}.${this.extension(outputFormat)}`,
      generated_by: user.id,
      generated_at: new Date().toISOString()
    }).select().single());
    await this.historyEvent(user, row, 'REPORT_GENERATED', 'MI report generated', null, row);
    await this.notify(user, siteId, 'mi.report.generated', 'MI report generated', `${row.report_title} is ready.`);
    return { row, preview: rows.slice(0, 50) };
  }

  async generatedReports(user: RequestUser, query: Query = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.scope(this.db.from('mi_generated_reports').select('*', { count: 'exact' }), user, query, true);
    if (query.reportCategory) request = request.eq('report_category', query.reportCategory);
    if (query.reportType) request = request.eq('report_type', query.reportType);
    if (query.status) request = request.eq('status', query.status);
    const { data, count, error } = await request.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], page, limit, total: count ?? data?.length ?? 0 };
  }

  async generatedReport(user: RequestUser, reportId: string) {
    const row = await this.db.single<any>(this.scope(this.db.from('mi_generated_reports').select('*').eq('id', reportId), user, {}, true).maybeSingle());
    if (!row) throw new NotFoundException('Generated MI report not found.');
    return { row, preview: await this.reportRows(user, row.report_type, row.filters_json ?? {}) };
  }

  async reportDownload(user: RequestUser, reportId: string) {
    const detail = await this.generatedReport(user, reportId);
    await this.historyEvent(user, detail.row, 'REPORT_DOWNLOADED', 'MI report downloaded', null, detail.row);
    return { fileName: `${this.slug(detail.row.report_title)}.${this.extension(detail.row.output_format)}`, content: this.renderRows(detail.row.output_format, detail.preview, detail.row.metadata_json) };
  }

  regenerateReport(user: RequestUser, reportId: string) {
    return this.generatedReport(user, reportId).then((detail) => this.generateReport(user, { reportTitle: `${detail.row.report_title} Regenerated`, reportType: detail.row.report_type, reportCategory: detail.row.report_category, outputFormat: detail.row.output_format, filters: detail.row.filters_json }));
  }

  async scheduledReports(user: RequestUser, query: Query = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.scope(this.db.from('mi_scheduled_reports').select('*', { count: 'exact' }), user, query, true);
    if (query.active === 'true') request = request.eq('active', true);
    const { data, count, error } = await request.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], page, limit, total: count ?? data?.length ?? 0 };
  }

  async createScheduledReport(user: RequestUser, body: Record<string, any>) {
    const template = await this.reportTemplate(user, this.required(body.reportTemplateId ?? body.report_template_id, 'Report template is required.'));
    const row = await this.db.single<any>(this.db.from('mi_scheduled_reports').insert({
      company_id: user.tenantId,
      site_id: body.siteId ?? body.site_id ?? template.site_id ?? user.selectedSiteId ?? null,
      schedule_name: this.required(body.scheduleName ?? body.schedule_name, 'Schedule name is required.'),
      report_template_id: template.id,
      schedule_frequency: this.required(body.scheduleFrequency ?? body.schedule_frequency, 'Schedule frequency is required.'),
      schedule_config_json: body.scheduleConfig ?? body.schedule_config_json ?? {},
      recipients_json: body.recipients ?? body.recipients_json ?? [],
      output_format: body.outputFormat ?? body.output_format ?? 'PDF',
      next_run_at: body.nextRunAt ?? body.next_run_at ?? null,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.historyEvent(user, row, 'SCHEDULED_REPORT_CREATED', 'MI scheduled report created', null, row);
    return row;
  }

  async updateScheduledReport(user: RequestUser, scheduleId: string, body: Record<string, any>) {
    const before = await this.db.single<any>(this.scope(this.db.from('mi_scheduled_reports').select('*').eq('id', scheduleId), user, {}, true).maybeSingle());
    if (!before) throw new NotFoundException('Scheduled report not found.');
    const row = await this.db.single<any>(this.db.from('mi_scheduled_reports').update({ ...body, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', scheduleId).select().single());
    await this.historyEvent(user, row, 'SCHEDULED_REPORT_UPDATED', 'MI scheduled report updated', before, row);
    return row;
  }

  disableScheduledReport(user: RequestUser, scheduleId: string) {
    return this.updateScheduledReport(user, scheduleId, { active: false });
  }

  async exportCenter(user: RequestUser, query: Query = {}) {
    const [jobs, packages] = await Promise.all([this.exportJobs(user, query), this.exportPackages(user, query)]);
    return { exportTypes, exportFormats, jobs: jobs.rows, packages: packages.rows, summary: { queued: jobs.rows.filter((row: any) => row.status === 'Queued').length, running: jobs.rows.filter((row: any) => row.status === 'Running').length, completed: jobs.rows.filter((row: any) => row.status === 'Completed').length, failed: jobs.rows.filter((row: any) => row.status === 'Failed').length }, lastUpdated: new Date().toISOString() };
  }

  async createExportJob(user: RequestUser, body: Record<string, any>) {
    const exportType = this.required(body.exportType ?? body.export_type, 'Export type is required.');
    const outputFormat = this.required(body.outputFormat ?? body.output_format, 'Output format is required.');
    this.assertFormat(outputFormat);
    this.assertDateRange(body);
    const siteId = body.siteId ?? body.site_id ?? user.selectedSiteId ?? null;
    const includeDocuments = !!(body.includeDocuments ?? body.include_documents);
    const includeAudit = !!(body.includeAudit ?? body.include_audit);
    if (includeDocuments && body.allowIncludeDocuments !== true && body.documentPermissionDenied === true) throw new ForbiddenException('Including documents requires document export permission.');
    if (includeAudit && body.allowIncludeAudit !== true && body.auditPermissionDenied === true) throw new ForbiddenException('Including audit history requires audit export permission.');
    const rows = await this.exportRows(user, exportType, body.filters ?? body.filters_json ?? {});
    const large = rows.length > 500 || outputFormat === 'ZIP evidence package';
    const job = await this.db.single<any>(this.db.from('mi_export_jobs').insert({
      company_id: user.tenantId,
      site_id: siteId,
      export_number: await this.nextNumber('MIEXP', user.tenantId, siteId, 'mi_export_jobs', 'export_number'),
      export_type: exportType,
      status: large ? 'Queued' : 'Completed',
      scope_type: body.scopeType ?? body.scope_type ?? (body.equipmentId ?? body.equipment_id ? 'Equipment' : 'Site'),
      equipment_id: body.equipmentId ?? body.equipment_id ?? null,
      filters_json: body.filters ?? body.filters_json ?? {},
      output_format: outputFormat,
      include_documents: includeDocuments,
      include_history: body.includeHistory ?? body.include_history ?? true,
      include_audit: includeAudit,
      include_linked_records: !!(body.includeLinkedRecords ?? body.include_linked_records),
      metadata_json: this.metadata(user, exportType, exportType, body.filters ?? {}, rows.length),
      file_key: `mi/exports/${Date.now()}-${this.slug(exportType)}.${this.extension(outputFormat)}`,
      requested_by: user.id,
      started_at: large ? null : new Date().toISOString(),
      completed_at: large ? null : new Date().toISOString(),
      records_count: rows.length
    }).select().single());
    await this.historyEvent(user, job, 'EXPORT_REQUESTED', 'MI export requested', null, job);
    await this.notify(user, siteId, large ? 'mi.export.queued' : 'mi.export.completed', large ? 'MI export queued' : 'MI export completed', `${exportType} ${large ? 'was queued' : 'is ready'}.`);
    return { job, preview: rows.slice(0, 50) };
  }

  async exportJobs(user: RequestUser, query: Query = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.scope(this.db.from('mi_export_jobs').select('*', { count: 'exact' }), user, query, true);
    if (query.exportType) request = request.eq('export_type', query.exportType);
    if (query.status) request = request.eq('status', query.status);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    const { data, count, error } = await request.order('requested_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], page, limit, total: count ?? data?.length ?? 0 };
  }

  async exportJob(user: RequestUser, exportJobId: string) {
    const row = await this.db.single<any>(this.scope(this.db.from('mi_export_jobs').select('*').eq('id', exportJobId), user, {}, true).maybeSingle());
    if (!row) throw new NotFoundException('MI export job not found.');
    return { row, preview: await this.exportRows(user, row.export_type, row.filters_json ?? {}) };
  }

  async cancelExportJob(user: RequestUser, exportJobId: string) {
    const detail = await this.exportJob(user, exportJobId);
    if (!['Queued','Running'].includes(detail.row.status)) throw new BadRequestException('Only queued or running export jobs can be cancelled.');
    const row = await this.db.single<any>(this.db.from('mi_export_jobs').update({ status: 'Cancelled', updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', exportJobId).select().single());
    await this.historyEvent(user, row, 'EXPORT_CANCELLED', 'MI export cancelled', detail.row, row);
    return row;
  }

  async downloadExportJob(user: RequestUser, exportJobId: string) {
    const detail = await this.exportJob(user, exportJobId);
    if (!['Completed','Queued'].includes(detail.row.status)) throw new BadRequestException('Download is unavailable until export completes.');
    if (detail.row.requested_by !== user.id && !user.corporateView) throw new ForbiddenException('Only requester or authorized users can download this export.');
    await this.historyEvent(user, detail.row, 'EXPORT_DOWNLOADED', 'MI export downloaded', null, detail.row);
    return { fileName: `${this.slug(detail.row.export_type)}-${detail.row.export_number}.${this.extension(detail.row.output_format)}`, content: this.renderRows(detail.row.output_format, detail.preview, detail.row.metadata_json) };
  }

  async equipmentIntegrityFileExport(user: RequestUser, equipmentId: string, body: Record<string, any> = {}) {
    const equipment = await this.resolveEquipment(user, equipmentId);
    const data = await this.equipmentHistory(user, equipmentId);
    const manifest = {
      equipment,
      includedSections: ['Equipment overview','Technical data','Criticality history','CML/TML registry','UT readings','Remaining life evaluations','Inspection plans','Inspection records','PM records','Calibration records','PSV / relief device links and tests','SIS/SIF/interlock/alarm links and tests','Bypass/impairment history','Deficiencies/deviations','Work orders/actions','Readiness assessments','Linked records','Linked documents','Approval history','Audit/history timeline','Export metadata'],
      generatedBy: user.id,
      generatedAt: new Date().toISOString(),
      recordsIncludedCount: data.rows.length
    };
    const pkg = await this.db.single<any>(this.db.from('mi_export_packages').insert({
      company_id: user.tenantId,
      site_id: equipment.site_id,
      package_number: await this.nextNumber('MIPKG', user.tenantId, equipment.site_id, 'mi_export_packages', 'package_number'),
      package_type: 'Equipment Integrity File',
      title: body.title ?? `Equipment Integrity File - ${equipment.tag ?? equipment.id}`,
      description: body.description ?? 'Complete audit-ready MI equipment integrity file.',
      equipment_id: equipment.id,
      status: 'Completed',
      manifest_json: manifest,
      zip_file_key: `mi/packages/${Date.now()}-${equipment.id}-integrity-file.zip`,
      created_by: user.id,
      completed_at: new Date().toISOString()
    }).select().single());
    await this.createPackageItems(user, pkg, data.rows);
    const job = await this.createExportJob(user, { exportType: 'Equipment Integrity File', outputFormat: body.outputFormat ?? 'ZIP evidence package', scopeType: 'Equipment', equipmentId, includeDocuments: true, includeHistory: true, includeAudit: !!body.includeAudit, includeLinkedRecords: true, filters: { equipmentId } });
    await this.db.single<any>(this.db.from('mi_export_jobs').update({ package_id: pkg.id }).eq('id', job.job.id).select('id').single()).catch(() => null);
    return { package: pkg, exportJob: job.job, manifest };
  }

  async exportPackages(user: RequestUser, query: Query = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.scope(this.db.from('mi_export_packages').select('*', { count: 'exact' }), user, query, true);
    if (query.packageType) request = request.eq('package_type', query.packageType);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    const { data, count, error } = await request.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    return { rows: data ?? [], page, limit, total: count ?? data?.length ?? 0 };
  }

  async exportPackage(user: RequestUser, packageId: string) {
    const row = await this.db.single<any>(this.scope(this.db.from('mi_export_packages').select('*').eq('id', packageId), user, {}, true).maybeSingle());
    if (!row) throw new NotFoundException('MI export package not found.');
    const items = await this.db.many<any>(this.db.from('mi_export_package_items').select('*').eq('company_id', user.tenantId).eq('package_id', packageId).order('created_at')).catch(() => []);
    return { row, items };
  }

  async downloadPackage(user: RequestUser, packageId: string) {
    const detail = await this.exportPackage(user, packageId);
    await this.historyEvent(user, detail.row, 'EXPORT_PACKAGE_DOWNLOADED', 'MI export package downloaded', null, detail.row);
    return { fileName: `${this.slug(detail.row.title)}.json`, content: JSON.stringify({ manifest: detail.row.manifest_json, items: detail.items }, null, 2) };
  }

  lookups() {
    return { reportCategories: Object.keys(reportCategories), reportTypes: reportCategories, exportTypes, exportFormats, historyEventTypes };
  }

  private async historyEvents(user: RequestUser, query: Query = {}) {
    const all: any[] = [];
    for (const source of historySources) {
      let request = this.scope(this.db.from(source.table).select('*'), user, query, false);
      if (query.eventId) request = request.eq('id', query.eventId);
      if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
      if (query.sourceModule && source.table === 'mi_history_event_views') request = request.eq('source_module', query.sourceModule);
      if (query.from) request = request.gte(source.timeField, query.from);
      if (query.to) request = request.lte(source.timeField, query.to);
      const rows = await this.db.many<any>(request.order(source.timeField, { ascending: false }).limit(250)).catch(() => []);
      all.push(...rows.map((row) => this.normalizeHistory(row, source)));
    }
    return this.applyHistoryFilters(all, query).sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime());
  }

  private normalizeHistory(row: any, source: any) {
    const sourceModule = row.source_module ?? row.linked_module ?? source.module;
    const eventAt = row[source.timeField] ?? row.created_at ?? row.event_at ?? new Date().toISOString();
    const severity = row.event_severity ?? row.severity ?? (/critical|failed|overdue|expired|blocked/i.test(`${row.event_type} ${row.event_title}`) ? 'Critical' : 'Info');
    return {
      id: row.id,
      sourceTable: source.table,
      companyId: row.company_id ?? row.tenant_id,
      siteId: row.site_id,
      equipmentId: row.equipment_id ?? null,
      sourceModule,
      sourceRecordId: row[source.recordField] ?? row.source_record_id ?? row.linked_record_id ?? null,
      sourceRecordNumber: row[source.numberField] ?? row.source_record_number ?? row.linked_record_number ?? null,
      eventType: row.event_type ?? 'Updated',
      eventTitle: row.event_title ?? row.title ?? 'MI event',
      eventDescription: row.event_description ?? row.description ?? null,
      eventAt,
      actorUserId: row[source.actorField] ?? row.created_by ?? row.updated_by ?? null,
      severity,
      readinessImpact: !!(row.readiness_impact ?? /readiness/i.test(`${sourceModule} ${row.event_type}`)),
      startupImpact: !!(row.startup_impact ?? row.startup_blocker),
      beforeAfterAvailable: Boolean(row.before_value_json ?? row.before_values_json ?? row.before_snapshot_json ?? row.before_json),
      beforeValues: row.before_value_json ?? row.before_values_json ?? row.before_snapshot_json ?? row.before_json ?? null,
      afterValues: row.after_value_json ?? row.after_values_json ?? row.after_snapshot_json ?? row.after_json ?? null,
      linkedRecords: row.linked_records_json ?? [],
      auditLogId: row.audit_log_id ?? null
    };
  }

  private applyHistoryFilters(events: any[], query: Query) {
    let rows = events;
    if (query.search) {
      const needle = query.search.toLowerCase();
      rows = rows.filter((row) => `${row.eventTitle} ${row.sourceRecordNumber} ${row.sourceModule} ${row.equipmentId}`.toLowerCase().includes(needle));
    }
    if (query.eventType) rows = rows.filter((row) => row.eventType === query.eventType || row.eventTitle === query.eventType);
    if (query.sourceModule) rows = rows.filter((row) => row.sourceModule === query.sourceModule);
    if (query.severity) rows = rows.filter((row) => row.severity === query.severity);
    if (query.actorUserId) rows = rows.filter((row) => row.actorUserId === query.actorUserId);
    if (query.readinessImpact === 'true') rows = rows.filter((row) => row.readinessImpact);
    if (query.startupImpact === 'true') rows = rows.filter((row) => row.startupImpact);
    if (query.beforeAfter === 'true') rows = rows.filter((row) => row.beforeAfterAvailable);
    if (query.approvalEvent === 'true') rows = rows.filter((row) => /approval|approved|rejected|returned/i.test(`${row.sourceModule} ${row.eventType}`));
    if (query.exportEvent === 'true') rows = rows.filter((row) => /export|report/i.test(`${row.sourceModule} ${row.eventType}`));
    if (query.documentEvent === 'true') rows = rows.filter((row) => /document/i.test(`${row.sourceModule} ${row.eventType}`));
    if (query.criticalOnly === 'true') rows = rows.filter((row) => /critical|failed|overdue|expired|blocked/i.test(`${row.severity} ${row.eventTitle} ${row.eventType}`));
    return rows;
  }

  private historySummary(events: any[]) {
    const month = new Date().getMonth();
    const thisMonth = (row: any) => new Date(row.eventAt).getMonth() === month;
    return {
      totalHistoryEvents: events.length,
      eventsThisMonth: events.filter(thisMonth).length,
      criticalEvents: events.filter((row) => /critical|failed|overdue|expired|blocked/i.test(`${row.severity} ${row.eventTitle}`)).length,
      readinessStatusChanges: events.filter((row) => /readiness|startup/i.test(`${row.eventTitle} ${row.sourceModule}`)).length,
      approvedRecords: events.filter((row) => /approved/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      rejectedReturnedRecords: events.filter((row) => /rejected|returned/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      failedTests: events.filter((row) => /failed/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      closedDeficiencies: events.filter((row) => /deficiency/i.test(row.sourceModule) && /closed/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      completedWorkOrders: events.filter((row) => /work/i.test(row.sourceModule) && /completed|closed/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      activeDeviations: events.filter((row) => /deviation/i.test(row.sourceModule) && /active|approved/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      expiredBypasses: events.filter((row) => /bypass|impairment/i.test(row.sourceModule) && /expired/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      documentsLinked: events.filter((row) => /document linked/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      reportsGenerated: events.filter((row) => /report generated/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      exportsGenerated: events.filter((row) => /export/i.test(`${row.eventType} ${row.eventTitle}`)).length,
      userActionsThisMonth: events.filter((row) => row.actorUserId && thisMonth(row)).length
    };
  }

  private async reportRows(user: RequestUser, reportType: string, filters: Record<string, any>) {
    if (/history|audit/i.test(reportType)) return this.historyEvents(user, filters);
    if (/approval/i.test(reportType)) return this.db.many<any>(this.scope(this.db.from('mi_approval_instances').select('*'), user, filters, false).limit(500)).catch(() => []);
    if (/readiness|fitness|startup/i.test(reportType)) return this.db.many<any>(this.scope(this.db.from('mi_readiness_assessments').select('*'), user, filters, false).limit(500)).catch(() => []);
    if (/document/i.test(reportType)) return this.db.many<any>(this.scope(this.db.from('mi_document_links').select('*'), user, filters, false).limit(500)).catch(() => []);
    if (/work/i.test(reportType)) return this.db.many<any>(this.scope(this.db.from('mi_work_orders').select('*'), user, filters, false).limit(500)).catch(() => []);
    if (/deficiency|deviation/i.test(reportType)) return this.db.many<any>(this.scope(this.db.from('mi_deficiencies').select('*'), user, filters, false).limit(500)).catch(() => []);
    if (/bypass|impairment/i.test(reportType)) return this.db.many<any>(this.scope(this.db.from('mi_safeguard_impairments').select('*'), user, filters, false).limit(500)).catch(() => []);
    return this.db.many<any>(this.db.from('Equipment').select('*').eq('tenantId', user.tenantId).limit(500)).catch(() => []);
  }

  private exportRows(user: RequestUser, exportType: string, filters: Record<string, any>) {
    return this.reportRows(user, exportType, filters);
  }

  private async createPackageItems(user: RequestUser, pkg: any, events: any[]) {
    const rows = events.slice(0, 200).map((event) => ({
      company_id: user.tenantId,
      site_id: pkg.site_id,
      package_id: pkg.id,
      item_type: 'History Event',
      source_module: event.sourceModule,
      source_record_id: event.sourceRecordId,
      item_title: event.eventTitle,
      item_status: 'Included',
      included: true
    }));
    if (rows.length) await this.db.many(this.db.from('mi_export_package_items').insert(rows).select()).catch(() => []);
  }

  private async resolveEquipment(user: RequestUser, equipmentId: string) {
    const row = await this.db.single<any>(this.db.from('Equipment').select('id,tenantId,siteId,tag,name,type,status,safetyCritical,psmCritical').eq('tenantId', user.tenantId).eq('id', equipmentId).maybeSingle());
    if (!row) throw new NotFoundException('Equipment not found.');
    this.assertSite(user, row.siteId);
    return { ...row, company_id: user.tenantId, site_id: row.siteId };
  }

  private scope(request: any, user: RequestUser, query: Query | Record<string, any>, nullableSite: boolean) {
    let scoped = request;
    const companyField = request?.url?.pathname?.includes('Equipment') ? 'tenantId' : 'company_id';
    scoped = scoped.eq(companyField, user.tenantId);
    const siteId = query.siteId ?? query.site_id;
    if (siteId) scoped = nullableSite ? scoped.or(`site_id.eq.${siteId},site_id.is.null`) : scoped.eq('site_id', siteId);
    else if (user.selectedSiteId) scoped = nullableSite ? scoped.or(`site_id.eq.${user.selectedSiteId},site_id.is.null`) : scoped.eq('site_id', user.selectedSiteId);
    else if (!user.corporateView && user.siteIds.length) scoped = scoped.in('site_id', user.siteIds);
    if (query.equipmentId ?? query.equipment_id) scoped = scoped.eq('equipment_id', query.equipmentId ?? query.equipment_id);
    return scoped;
  }

  private assertSite(user: RequestUser, siteId?: string | null) {
    if (siteId && !user.corporateView && user.siteIds.length && !user.siteIds.includes(siteId)) throw new ForbiddenException('Record is outside your site access scope.');
  }

  private async historyEvent(user: RequestUser, row: any, eventType: string, title: string, before: unknown, after: unknown) {
    const payload = {
      company_id: row.company_id ?? user.tenantId,
      site_id: row.site_id ?? user.selectedSiteId ?? null,
      equipment_id: row.equipment_id ?? null,
      source_module: row.report_type ? 'Reports' : row.export_type ? 'Export' : 'Mechanical Integrity',
      source_record_id: row.id ?? null,
      source_record_number: row.report_number ?? row.export_number ?? row.package_number ?? null,
      event_type: eventType,
      event_title: title,
      event_description: title,
      event_severity: /failed|denied|blocked/i.test(eventType) ? 'Critical' : 'Info',
      actor_user_id: user.id,
      before_value_json: before as JsonValue,
      after_value_json: after as JsonValue,
      searchable_text: `${title} ${eventType} ${row.report_number ?? row.export_number ?? row.package_number ?? ''}`
    };
    await this.db.single(this.db.from('mi_history_event_views').insert(payload).select('id').single()).catch(() => null);
    await this.writeAudit(user, eventType, 'MechanicalIntegrityHistoryReporting', String(row.id ?? ''), before, after);
  }

  private writeAudit(user: RequestUser, action: string, entityType: string, entityId: string, before: unknown, after: unknown) {
    return this.audit.write({ tenantId: user.tenantId, actorId: user.id, action, entityType, entityId, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
  }

  private notify(user: RequestUser, siteId: string | null, type: string, title: string, message: string) {
    return this.notifications.notifyUser({ tenantId: user.tenantId, userId: user.id, siteId: siteId ?? undefined, type, module: 'mechanical-integrity', title, message, priority: 'Normal' }).catch(() => null);
  }

  private required(value: unknown, message: string) {
    if (value === undefined || value === null || value === '') throw new BadRequestException(message);
    return String(value);
  }

  private assertFormat(format: string) {
    if (!exportFormats.includes(format)) throw new BadRequestException(`Unsupported output format: ${format}`);
  }

  private assertDateRange(body: Record<string, any>) {
    const from = body.dateFrom ?? body.date_from ?? body.filters?.dateFrom;
    const to = body.dateTo ?? body.date_to ?? body.filters?.dateTo;
    if (from && to && new Date(from).getTime() > new Date(to).getTime()) throw new BadRequestException('Date range is invalid.');
  }

  private categoryFor(reportType: string) {
    return Object.entries(reportCategories).find(([, values]) => values.includes(reportType))?.[0] ?? 'Management';
  }

  private metadata(user: RequestUser, title: string, type: string, filters: unknown, count: number) {
    return { title, type, company: user.tenantId, site: user.selectedSiteId ?? null, generatedBy: user.id, generatedAt: new Date().toISOString(), filters, recordsIncludedCount: count, permissionScope: { sites: user.siteIds, corporateView: user.corporateView ?? false }, templateVersion: '1.0', confidentialityFooter: 'Generated from approved/current system records where applicable.', systemVersion: 'PSM OS' };
  }

  private renderRows(format: string, rows: any[], metadata: unknown) {
    if (format === 'JSON' || /zip/i.test(format)) return JSON.stringify({ metadata, rows }, null, 2);
    return this.csv(rows, Object.keys(rows[0] ?? { message: 'No rows matched filters' }));
  }

  private csv(rows: any[], columns: string[]) {
    const safe = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [columns.join(','), ...rows.map((row) => columns.map((column) => safe(row[column])).join(','))].join('\n');
  }

  private extension(format: string) {
    if (format === 'JSON') return 'json';
    if (format === 'Excel') return 'csv';
    if (/zip/i.test(format)) return 'json';
    return 'csv';
  }

  private slug(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'mi-export';
  }

  private async nextNumber(prefix: string, companyId: string, siteId: string | null, table: string, column: string) {
    const count = await this.db.many<any>(this.db.from(table).select('id').eq('company_id', companyId).limit(10000)).catch(() => []);
    const site = siteId ? siteId.slice(0, 4).toUpperCase() : 'ALL';
    return `${prefix}-${site}-${new Date().getFullYear()}-${String(count.length + 1).padStart(6, '0')}`;
  }
}
