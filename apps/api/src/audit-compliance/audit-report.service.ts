import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { AuditReportHistoryService } from "./audit-report-history.service";

type Row = Record<string, any>;

const REPORT_STATUSES = ["Draft", "Generated", "Pending Approval", "Approved", "Locked", "Stale", "Failed", "Exported", "Historical", "Archived"];
const READINESS_STATUSES = ["Not Ready", "Ready", "Warning", "Blocked", "Needs Validation", "Ready For Approval", "Ready For Export"];
const STALE_STATUSES = ["Current", "Stale", "Source Changed", "Refresh Required", "Approved Historical"];
const REPORT_FORMATS = ["PDF", "DOCX", "XLSX", "CSV", "JSON", "ZIP"];
const TEMPLATE_STATUSES = ["Draft", "Pending Approval", "Approved", "Active", "Archived", "Superseded"];
const PACKAGE_TYPES = ["Audit Report Package", "Evidence Package", "Closeout Package", "Regulatory Package", "Management Review Package"];
const PACKAGE_STATUSES = ["Draft", "Preparing", "Prepared", "Exported", "Failed", "Archived"];
const REPORT_TYPES = ["Program Summary", "Plan Report", "Execution Report", "Finding Report", "CAPA Report", "Evidence Manifest", "Scoring Report", "Standards Traceability", "Review Approval Package", "Site Report", "Unit Report", "Area Report", "Custom"];
const AUDIENCES = ["Internal", "Site Leadership", "Corporate", "Regulator", "Third Party Auditor", "Management Review", "Restricted"];

const SOURCE_CONFIG: Record<string, { table: string; idField?: string; code: string; title: string; status: string; type: string }> = {
  program: { table: "audit_programs", code: "program_code", title: "program_title", status: "program_status", type: "Program" },
  plan: { table: "audit_plans", code: "plan_code", title: "plan_title", status: "plan_status", type: "Plan" },
  checklist: { table: "audit_checklist_templates", code: "checklist_code", title: "checklist_title", status: "checklist_status", type: "Checklist" },
  execution: { table: "audit_executions", code: "execution_code", title: "execution_title", status: "execution_status", type: "Execution" },
  finding: { table: "audit_findings", code: "finding_code", title: "finding_title", status: "finding_status", type: "Finding" },
  capa: { table: "audit_capa_packages", code: "capa_code", title: "capa_title", status: "capa_status", type: "CAPA" },
  evidence: { table: "audit_evidence_package_foundations", code: "package_code", title: "package_title", status: "package_status", type: "Evidence Package" },
  scoring: { table: "audit_score_runs", code: "run_code", title: "run_title", status: "run_status", type: "Scoring" },
  "score-run": { table: "audit_score_runs", code: "run_code", title: "run_title", status: "run_status", type: "Scoring" },
  "standards-mapping": { table: "audit_standard_mappings", code: "mapping_code", title: "mapping_title", status: "mapping_status", type: "Standards Mapping" },
  approval: { table: "audit_approval_packages", code: "package_number", title: "package_title", status: "package_status", type: "Review Approval Package" },
  "review-approval": { table: "audit_approval_packages", code: "package_number", title: "package_title", status: "package_status", type: "Review Approval Package" },
};

@Injectable()
export class AuditReportService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditReportHistoryService,
  ) {}

  lookups() {
    return {
      reportTypes: REPORT_TYPES,
      reportStatuses: REPORT_STATUSES,
      reportReadinessStatuses: READINESS_STATUSES,
      reportStaleStatuses: STALE_STATUSES,
      reportFormats: REPORT_FORMATS,
      reportTemplateStatuses: TEMPLATE_STATUSES,
      reportPackageTypes: PACKAGE_TYPES,
      reportPackageStatuses: PACKAGE_STATUSES,
      reportIntendedAudiences: AUDIENCES,
    };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, templates, settings] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.templates(user, { limit: 250 }),
      this.settings(user, user.selectedSiteId ?? null),
    ]);
    return {
      sites: sites.filter((site: Row) => this.canSeeSite(user, site.id)),
      units,
      areas,
      templates: templates.rows,
      settings,
      lookups: this.lookups(),
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const register = await this.register(user, { ...query, page: 1, limit: 1000 });
    const rows = register.rows;
    const jobs = await this.jobs(user, { ...query, limit: 250 });
    const downloads = await this.downloads(user, { ...query, limit: 250 });
    return {
      summary: this.summary(rows, jobs.rows, downloads.rows),
      bySite: this.group(rows, "site_id"),
      byType: this.group(rows, "report_type"),
      byStatus: this.group(rows, "report_status"),
      staleReports: rows.filter((row) => row.stale_status && row.stale_status !== "Current"),
      failedJobs: jobs.rows.filter((row) => row.job_status === "Failed"),
      recentReports: rows.slice(0, 12),
      downloadActivity: downloads.rows.slice(0, 20),
      templates: (await this.templates(user, { limit: 12 })).rows,
      packages: (await this.packages(user, { limit: 12 })).rows,
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const dashboard = await this.dashboard(user, query);
    return dashboard.summary;
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_reports").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    const siteId = query.siteId ?? user.selectedSiteId;
    if (siteId) {
      this.assertSite(user, String(siteId));
      request = request.eq("site_id", siteId);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [input, column] of Object.entries({
      status: "report_status",
      reportStatus: "report_status",
      readinessStatus: "readiness_status",
      staleStatus: "stale_status",
      reportType: "report_type",
      sourceModule: "source_module",
      sourceRecordId: "source_record_id",
      templateId: "template_id",
      programId: "program_id",
      planId: "plan_id",
      executionId: "execution_id",
      findingId: "finding_id",
      capaId: "capa_id",
      approvalId: "approval_id",
      unitId: "unit_id",
      areaId: "area_id",
    })) {
      if (query[input]) request = request.eq(column, query[input]);
    }
    if (query.view) request = this.applyReportView(request, String(query.view));
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`report_code.ilike.%${search}%,report_title.ilike.%${search}%,source_record_number.ilike.%${search}%,source_record_title.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const scoped = ((data ?? []) as Row[]).filter((row) => this.canSeeReport(user, row)).map((row) => this.redactReport(user, row));
    return { rows: scoped, total: count ?? scoped.length, page, limit, summary: this.summary(scoped) };
  }

  async detail(user: RequestUser, reportId: string) {
    const report = await this.report(user, reportId);
    const [source, sections, evidence, files, versions, access, downloads, approvals, staleness, validation, history] = await Promise.all([
      this.children(user, "audit_report_source_links", report.id, "report_id"),
      this.children(user, "audit_report_sections", report.id, "report_id", "section_order", true),
      this.children(user, "audit_report_evidence_items", report.id, "report_id"),
      this.children(user, "audit_report_files", report.id, "report_id", "created_at", false),
      this.children(user, "audit_report_versions", report.id, "report_id", "version_number", false),
      this.children(user, "audit_report_access_events", report.id, "report_id", "accessed_at", false),
      this.children(user, "audit_report_download_events", report.id, "report_id", "downloaded_at", false),
      this.children(user, "audit_report_approval_links", report.id, "report_id", "linked_at", false),
      this.children(user, "audit_report_staleness_events", report.id, "report_id", "detected_at", false),
      this.children(user, "audit_report_validation_results", report.id, "report_id", "created_at", false),
      this.children(user, "audit_report_history_events", report.id, "report_id", "created_at", false),
    ]);
    const readiness = this.readiness(report, sections, evidence, validation);
    return {
      report: this.redactReport(user, report),
      source,
      snapshot: report.source_snapshot_json ?? {},
      sections,
      evidence,
      findings: this.filteredSource(report, "Finding"),
      capa: this.filteredSource(report, "CAPA"),
      scoring: this.filteredSource(report, "Scoring"),
      standards: this.filteredSource(report, "Standards Mapping"),
      approval: approvals,
      files,
      versions,
      access,
      downloads,
      staleness,
      validation,
      history,
      readiness,
      preview: this.previewFromSnapshot(report, sections, evidence, readiness),
    };
  }

  async section(user: RequestUser, reportId: string, section: string) {
    const detail = await this.detail(user, reportId);
    if (section === "source") return detail.source;
    if (section === "snapshot") return detail.snapshot;
    if (section === "sections") return detail.sections;
    if (section === "evidence") return detail.evidence;
    if (section === "findings") return detail.findings;
    if (section === "capa") return detail.capa;
    if (section === "scoring") return detail.scoring;
    if (section === "standards") return detail.standards;
    if (section === "approval") return detail.approval;
    if (section === "files") return detail.files;
    if (section === "versions") return detail.versions;
    if (section === "access") return { access: detail.access, downloads: detail.downloads };
    if (section === "history") return detail.history;
    return detail;
  }

  async create(user: RequestUser, dto: Row) {
    const sourceModule = this.normalizeSource(dto.sourceModule ?? dto.source_module ?? "program");
    const sourceRecordId = String(dto.sourceRecordId ?? dto.source_record_id ?? "");
    if (!sourceModule || !sourceRecordId) throw new BadRequestException("Source module and source record are required.");
    const source = await this.sourceRow(user, sourceModule, sourceRecordId);
    const siteId = dto.siteId ?? dto.site_id ?? source.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const settings = await this.settings(user, siteId);
    const template = dto.templateId ?? dto.template_id ? await this.template(user, String(dto.templateId ?? dto.template_id)) : null;
    const reportCode = dto.reportCode ?? dto.report_code ?? await this.nextCode(user, siteId);
    const includedSections = this.sectionsFromDto(dto, template);
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? source.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? source.area_id ?? null,
      program_id: this.sourceId(sourceModule, "program", sourceRecordId, source),
      plan_id: this.sourceId(sourceModule, "plan", sourceRecordId, source),
      execution_id: this.sourceId(sourceModule, "execution", sourceRecordId, source),
      finding_id: this.sourceId(sourceModule, "finding", sourceRecordId, source),
      capa_id: this.sourceId(sourceModule, "capa", sourceRecordId, source),
      evidence_package_id: this.sourceId(sourceModule, "evidence", sourceRecordId, source),
      scoring_run_id: this.sourceId(sourceModule, "scoring", sourceRecordId, source),
      standards_mapping_id: this.sourceId(sourceModule, "standards-mapping", sourceRecordId, source),
      approval_id: this.sourceId(sourceModule, "approval", sourceRecordId, source),
      template_id: template?.id ?? null,
      report_code: reportCode,
      report_title: dto.reportTitle ?? dto.report_title ?? `${this.sourceLabel(sourceModule)} report - ${source[this.titleColumn(sourceModule)] ?? sourceRecordId}`,
      report_description: dto.reportDescription ?? dto.report_description ?? null,
      report_type: dto.reportType ?? dto.report_type ?? this.reportTypeFor(sourceModule),
      report_status: dto.reportStatus ?? dto.report_status ?? "Draft",
      readiness_status: "Needs Validation",
      stale_status: "Current",
      source_module: this.sourceLabel(sourceModule),
      source_record_type: SOURCE_CONFIG[sourceModule]?.type ?? sourceModule,
      source_record_id: sourceRecordId,
      source_record_number: source[this.codeColumn(sourceModule)] ?? null,
      source_record_title: source[this.titleColumn(sourceModule)] ?? null,
      source_record_status: source[this.statusColumn(sourceModule)] ?? null,
      source_snapshot_json: source,
      source_snapshot_hash: this.hash(source),
      included_sections_json: includedSections,
      included_formats_json: dto.formats ?? dto.includedFormats ?? [template?.default_format ?? settings.default_format ?? "PDF"],
      intended_audience: dto.intendedAudience ?? dto.intended_audience ?? template?.intended_audience ?? "Internal",
      confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level ?? settings.default_confidentiality_level ?? "Internal",
      restricted: this.bool(dto.restricted, false),
      restricted_reason: dto.restrictedReason ?? dto.restricted_reason ?? null,
      redaction_required: this.bool(dto.redactionRequired ?? dto.redaction_required, false),
      approval_required: this.bool(dto.approvalRequired ?? dto.approval_required, Boolean(template?.approval_required ?? settings.require_approval_for_official)),
      approved_snapshot_required: this.bool(dto.approvedSnapshotRequired ?? dto.approved_snapshot_required, false),
      created_by: user.id,
      updated_by: user.id,
    });
    const created = await this.db.single<Row>(this.db.from("audit_reports").insert(payload).select().single());
    await this.createSourceLink(user, created, sourceModule, sourceRecordId, source);
    await this.createSections(user, created, includedSections);
    await this.createEvidenceItems(user, created);
    await this.write(user, created, "Audit Report Created", "Report source snapshot and section foundation created.", null, created);
    return this.detail(user, created.id);
  }

  async update(user: RequestUser, reportId: string, dto: Row) {
    const before = await this.report(user, reportId);
    this.assertEditable(user, before);
    const patch = this.withoutUndefined({
      report_title: dto.reportTitle ?? dto.report_title,
      report_description: dto.reportDescription ?? dto.report_description,
      report_type: dto.reportType ?? dto.report_type,
      intended_audience: dto.intendedAudience ?? dto.intended_audience,
      confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level,
      restricted: dto.restricted,
      restricted_reason: dto.restrictedReason ?? dto.restricted_reason,
      redaction_required: dto.redactionRequired ?? dto.redaction_required,
      included_sections_json: dto.includedSections ?? dto.included_sections_json,
      included_formats_json: dto.formats ?? dto.includedFormats ?? dto.included_formats_json,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    if (!Object.keys(patch).length) return this.detail(user, reportId);
    const after = await this.db.single<Row>(this.db.from("audit_reports").update(patch).eq("company_id", user.tenantId).eq("id", reportId).select().single());
    await this.write(user, after, "Audit Report Updated", "Report metadata updated.", before, after);
    return this.detail(user, reportId);
  }

  async generate(user: RequestUser, dto: Row) {
    const detail = dto.reportId || dto.report_id ? await this.detail(user, String(dto.reportId ?? dto.report_id)) : await this.create(user, dto);
    return this.transition(user, detail.report.id, "generate", dto);
  }

  async preview(user: RequestUser, dto: Row) {
    const sourceModule = this.normalizeSource(dto.sourceModule ?? dto.source_module ?? "program");
    const sourceRecordId = String(dto.sourceRecordId ?? dto.source_record_id ?? "");
    if (!sourceRecordId) throw new BadRequestException("Preview requires source record.");
    const source = await this.sourceRow(user, sourceModule, sourceRecordId);
    return {
      previewStatus: "Generated From Source Snapshot",
      sourceModule: this.sourceLabel(sourceModule),
      sourceRecordId,
      snapshotHash: this.hash(source),
      sections: this.sectionsFromDto(dto, null),
      manifest: this.manifestFromSource(sourceModule, source, dto),
    };
  }

  async transition(user: RequestUser, reportId: string, action: string, dto: Row = {}) {
    const before = await this.report(user, reportId);
    const now = new Date().toISOString();
    const settings = await this.settings(user, before.site_id ?? null);
    const patch: Row = { updated_by: user.id, updated_at: now };
    let title = "Audit Report Updated";
    let description = dto.reason ?? title;
    let job: Row | null = null;
    if (["generate", "regenerate"].includes(action)) {
      const readiness = this.readiness(before, await this.children(user, "audit_report_sections", before.id, "report_id"), await this.children(user, "audit_report_evidence_items", before.id, "report_id"), await this.children(user, "audit_report_validation_results", before.id, "report_id"));
      if (readiness.status === "Blocked") throw new BadRequestException(`Report generation blocked: ${readiness.blockers.map((item: Row) => item.title).join(", ")}`);
      job = await this.createJob(user, before, action === "regenerate" ? "Regenerate" : "Generate", dto);
      patch.report_status = "Generated";
      patch.readiness_status = readiness.status === "Ready" ? "Ready For Export" : readiness.status;
      patch.stale_status = "Current";
      patch.generated_by = user.id;
      patch.generated_at = now;
      patch.report_manifest_json = this.manifestFromSource(String(before.source_module ?? "Report"), before.source_snapshot_json ?? before, dto);
      title = action === "regenerate" ? "Audit Report Regenerated" : "Audit Report Generated";
      description = "Backend report generation job completed and manifest snapshot updated.";
    } else if (action === "submit-approval") {
      patch.report_status = "Pending Approval";
      patch.submitted_for_approval_by = user.id;
      patch.submitted_for_approval_at = now;
      title = "Audit Report Submitted For Approval";
    } else if (action === "lock") {
      const readiness = this.readiness(before, await this.children(user, "audit_report_sections", before.id, "report_id"), await this.children(user, "audit_report_evidence_items", before.id, "report_id"), await this.children(user, "audit_report_validation_results", before.id, "report_id"));
      if (settings.block_current_if_stale && before.stale_status !== "Current") throw new BadRequestException("Stale reports cannot be locked until regenerated or marked historical with reason.");
      if (readiness.status === "Blocked") throw new BadRequestException(`Report lock blocked: ${readiness.blockers.map((item: Row) => item.title).join(", ")}`);
      patch.report_status = "Locked";
      patch.locked = true;
      patch.locked_by = user.id;
      patch.locked_at = now;
      title = "Audit Report Locked";
    } else if (action === "unlock") {
      if (!dto.reason) throw new BadRequestException("Unlock requires reason.");
      patch.report_status = before.report_status === "Locked" ? "Generated" : before.report_status;
      patch.locked = false;
      title = "Audit Report Unlocked";
    } else if (action === "archive") {
      if (!dto.reason) throw new BadRequestException("Archive requires reason.");
      patch.report_status = "Archived";
      patch.archived_by = user.id;
      patch.archived_at = now;
      title = "Audit Report Archived";
    } else if (action === "mark-historical") {
      if (!dto.reason) throw new BadRequestException("Mark historical requires reason.");
      patch.report_status = "Historical";
      patch.stale_status = "Approved Historical";
      patch.marked_historical_by = user.id;
      patch.marked_historical_at = now;
      title = "Audit Report Marked Historical";
    } else if (action === "mark-stale") {
      patch.report_status = "Stale";
      patch.stale_status = "Stale";
      patch.stale_reason = dto.reason ?? "Source data changed.";
      title = "Audit Report Marked Stale";
    } else if (action === "run-validation") {
      await this.runValidation(user, before);
      patch.readiness_status = "Ready";
      title = "Audit Report Validation Run";
    } else if (action === "export") {
      job = await this.createJob(user, before, "Export", dto);
      patch.report_status = "Exported";
      title = "Audit Report Exported";
    } else {
      throw new BadRequestException("Unsupported report transition.");
    }
    const after = await this.db.single<Row>(this.db.from("audit_reports").update(patch).eq("company_id", user.tenantId).eq("id", reportId).select().single());
    if (["generate", "regenerate", "export"].includes(action)) await this.createFileRecord(user, after, job, dto);
    if (action === "mark-stale") await this.createStalenessEvent(user, after, description);
    await this.createVersion(user, after, title, dto.reason ?? null);
    await this.write(user, after, title, description, before, after, job);
    return this.detail(user, reportId);
  }

  async logPreview(user: RequestUser, reportId: string) {
    const report = await this.report(user, reportId);
    await this.accessEvent(user, report, null, "Preview", "Allowed");
    await this.write(user, report, "Audit Report Previewed", "Report preview access logged.", null, report);
    return this.detail(user, reportId).then((detail) => detail.preview);
  }

  async download(user: RequestUser, reportId: string, fileId?: string) {
    const report = await this.report(user, reportId);
    const file = fileId ? await this.file(user, reportId, fileId) : (await this.children(user, "audit_report_files", reportId, "report_id", "created_at", false))[0] ?? null;
    if (!file) throw new NotFoundException("No generated report file is available for download.");
    await this.accessEvent(user, report, file, "Download", "Allowed");
    await this.db.single(this.db.from("audit_report_download_events").insert({
      company_id: user.tenantId,
      site_id: report.site_id ?? null,
      report_id: report.id,
      file_id: file.id,
      download_format: file.file_format,
      download_status: "Logged",
      actor_user_id: user.id,
      secure_url_issued: Boolean(file.storage_path),
      metadata_json: { storageBucket: file.storage_bucket ?? null, storagePath: file.storage_path ?? null },
    }).select("id").single());
    await this.write(user, report, "Audit Report Downloaded", "Report download event logged.", null, file);
    return {
      reportId: report.id,
      fileId: file.id,
      fileName: file.file_name,
      fileFormat: file.file_format,
      downloadStatus: file.storage_path ? "Secure storage URL pending adapter resolution" : "File metadata only; storage object is not available.",
      storageBucket: file.storage_bucket ?? null,
      storagePath: file.storage_path ?? null,
    };
  }

  async templates(user: RequestUser, query: Row = {}) {
    return this.list(user, "audit_report_templates", query, "template_name", (request, q) => {
      if (q.status) request = request.eq("template_status", q.status);
      if (q.templateType) request = request.eq("template_type", q.templateType);
      return request;
    });
  }

  async saveTemplate(user: RequestUser, dto: Row, templateId?: string) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      template_code: dto.templateCode ?? dto.template_code ?? null,
      template_name: dto.templateName ?? dto.template_name,
      template_type: dto.templateType ?? dto.template_type ?? "Audit Report",
      template_status: dto.templateStatus ?? dto.template_status ?? "Draft",
      intended_audience: dto.intendedAudience ?? dto.intended_audience ?? "Internal",
      default_format: dto.defaultFormat ?? dto.default_format ?? "PDF",
      supported_formats: dto.supportedFormats ?? dto.supported_formats ?? ["PDF"],
      section_schema_json: dto.sectionSchema ?? dto.section_schema_json ?? {},
      evidence_rules_json: dto.evidenceRules ?? dto.evidence_rules_json ?? {},
      redaction_rules_json: dto.redactionRules ?? dto.redaction_rules_json ?? {},
      approval_required: this.bool(dto.approvalRequired ?? dto.approval_required, false),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      ...(templateId ? {} : { created_by: user.id }),
    });
    if (!payload.template_name) throw new BadRequestException("Template name is required.");
    const before = templateId ? await this.template(user, templateId) : null;
    const saved = templateId
      ? await this.db.single<Row>(this.db.from("audit_report_templates").update(payload).eq("company_id", user.tenantId).eq("id", templateId).select().single())
      : await this.db.single<Row>(this.db.from("audit_report_templates").insert(payload).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId: saved.site_id, actorId: user.id, templateId: saved.id, type: templateId ? "Audit Report Template Updated" : "Audit Report Template Created", title: templateId ? "Audit Report Template Updated" : "Audit Report Template Created", before, after: saved });
    return saved;
  }

  async templateTransition(user: RequestUser, templateId: string, action: string, dto: Row = {}) {
    const before = await this.template(user, templateId);
    const patch: Row = { updated_by: user.id, updated_at: new Date().toISOString() };
    if (action === "approve") {
      patch.template_status = "Approved"; patch.approved_by = user.id; patch.approved_at = patch.updated_at;
    } else if (action === "archive") {
      if (!dto.reason) throw new BadRequestException("Archive requires reason.");
      patch.template_status = "Archived"; patch.archived_by = user.id; patch.archived_at = patch.updated_at;
    } else if (action === "create-version") {
      patch.version_number = Number(before.version_number ?? 1) + 1; patch.template_status = "Draft";
    } else throw new BadRequestException("Unsupported template transition.");
    const after = await this.db.single<Row>(this.db.from("audit_report_templates").update(patch).eq("company_id", user.tenantId).eq("id", templateId).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId: after.site_id, actorId: user.id, templateId, type: `Audit Report Template ${action}`, title: `Audit Report Template ${action}`, description: dto.reason, before, after });
    return after;
  }

  async jobs(user: RequestUser, query: Row = {}) {
    return this.list(user, "audit_report_generation_jobs", query, "updated_at", (request, q) => {
      if (q.status) request = request.eq("job_status", q.status);
      if (q.reportId) request = request.eq("report_id", q.reportId);
      return request;
    }, false);
  }

  async job(user: RequestUser, jobId: string) {
    const row = await this.singleById(user, "audit_report_generation_jobs", jobId, "Report generation job not found.");
    return row;
  }

  async jobTransition(user: RequestUser, jobId: string, action: string, dto: Row = {}) {
    const before = await this.job(user, jobId);
    const patch: Row = { updated_at: new Date().toISOString() };
    if (action === "cancel") {
      patch.job_status = "Cancelled"; patch.cancelled_at = patch.updated_at;
    } else if (action === "retry") {
      patch.job_status = "Queued"; patch.progress_percent = 0; patch.error_message = null;
    } else throw new BadRequestException("Unsupported job transition.");
    const after = await this.db.single<Row>(this.db.from("audit_report_generation_jobs").update(patch).eq("company_id", user.tenantId).eq("id", jobId).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId: after.site_id, actorId: user.id, reportId: after.report_id, jobId, type: `Audit Report Job ${action}`, title: `Audit Report Job ${action}`, description: dto.reason, before, after });
    return after;
  }

  async packages(user: RequestUser, query: Row = {}) {
    return this.list(user, "audit_report_package_foundations", query, "updated_at", (request, q) => {
      if (q.status) request = request.eq("package_status", q.status);
      if (q.packageType) request = request.eq("package_type", q.packageType);
      return request;
    }, false);
  }

  async packageDetail(user: RequestUser, packageId: string) {
    const foundation = await this.singleById(user, "audit_report_package_foundations", packageId, "Report package not found.");
    const items = await this.children(user, "audit_report_package_items", packageId, "package_id", "item_order", true);
    return { package: foundation, items };
  }

  async createPackage(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const payload = {
      company_id: user.tenantId,
      site_id: siteId,
      package_code: dto.packageCode ?? dto.package_code ?? await this.nextPackageCode(user, siteId),
      package_title: dto.packageTitle ?? dto.package_title ?? "Audit report package",
      package_type: dto.packageType ?? dto.package_type ?? "Audit Report Package",
      package_status: "Draft",
      manifest_json: dto.manifest ?? {},
      requested_by: user.id,
    };
    const created = await this.db.single<Row>(this.db.from("audit_report_package_foundations").insert(payload).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId, actorId: user.id, packageId: created.id, type: "Audit Report Package Created", title: "Audit Report Package Created", after: created });
    return this.packageDetail(user, created.id);
  }

  async packageTransition(user: RequestUser, packageId: string, action: string, dto: Row = {}) {
    const before = (await this.packageDetail(user, packageId)).package;
    const patch: Row = { updated_at: new Date().toISOString() };
    if (action === "prepare") {
      patch.package_status = "Prepared"; patch.prepared_by = user.id; patch.prepared_at = patch.updated_at;
    } else if (action === "export") {
      patch.package_status = "Exported"; patch.exported_by = user.id; patch.exported_at = patch.updated_at;
    } else throw new BadRequestException("Unsupported package transition.");
    const after = await this.db.single<Row>(this.db.from("audit_report_package_foundations").update(patch).eq("company_id", user.tenantId).eq("id", packageId).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId: after.site_id, actorId: user.id, packageId, type: `Audit Report Package ${action}`, title: `Audit Report Package ${action}`, description: dto.reason, before, after });
    return this.packageDetail(user, packageId);
  }

  async addPackageItem(user: RequestUser, packageId: string, dto: Row) {
    const foundation = (await this.packageDetail(user, packageId)).package;
    const payload = {
      company_id: user.tenantId,
      site_id: foundation.site_id ?? null,
      package_id: packageId,
      report_id: dto.reportId ?? dto.report_id ?? null,
      evidence_id: dto.evidenceId ?? dto.evidence_id ?? null,
      file_id: dto.fileId ?? dto.file_id ?? null,
      item_type: dto.itemType ?? dto.item_type ?? (dto.reportId ? "Report" : "Evidence"),
      item_title: dto.itemTitle ?? dto.item_title ?? null,
      item_order: Number(dto.itemOrder ?? dto.item_order ?? 0),
      restricted: this.bool(dto.restricted, false),
      redacted: this.bool(dto.redacted, false),
      snapshot_json: dto.snapshot ?? {},
    };
    const created = await this.db.single<Row>(this.db.from("audit_report_package_items").insert(payload).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId: foundation.site_id, actorId: user.id, packageId, type: "Audit Report Package Item Added", title: "Audit Report Package Item Added", after: created });
    return this.packageDetail(user, packageId);
  }

  async removePackageItem(user: RequestUser, packageId: string, itemId: string) {
    const before = await this.singleById(user, "audit_report_package_items", itemId, "Package item not found.");
    await this.db.single(this.db.from("audit_report_package_items").delete().eq("company_id", user.tenantId).eq("id", itemId).select("id").single());
    await this.history.write({ tenantId: user.tenantId, siteId: before.site_id, actorId: user.id, packageId, type: "Audit Report Package Item Removed", title: "Audit Report Package Item Removed", before });
    return this.packageDetail(user, packageId);
  }

  async downloads(user: RequestUser, query: Row = {}) {
    return this.list(user, "audit_report_download_events", query, "downloaded_at", (request, q) => {
      if (q.reportId) request = request.eq("report_id", q.reportId);
      return request;
    }, false);
  }

  async accessLog(user: RequestUser, query: Row = {}) {
    return this.list(user, "audit_report_access_events", query, "accessed_at", (request, q) => {
      if (q.reportId) request = request.eq("report_id", q.reportId);
      if (q.accessType) request = request.eq("access_type", q.accessType);
      return request;
    }, false);
  }

  async historyEvents(user: RequestUser, query: Row = {}) {
    return this.list(user, "audit_report_history_events", query, "created_at", (request, q) => {
      if (q.reportId) request = request.eq("report_id", q.reportId);
      return request;
    }, false);
  }

  async settings(user: RequestUser, siteId: string | null) {
    if (siteId) this.assertSite(user, siteId);
    let request: any = this.db.from("audit_report_settings").select("*").eq("company_id", user.tenantId);
    request = siteId ? request.eq("site_id", siteId) : request.is("site_id", null);
    const { data, error } = await request.maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data ?? {
      company_id: user.tenantId,
      site_id: siteId,
      allow_pdf_export: true,
      allow_docx_export: true,
      allow_xlsx_export: true,
      allow_csv_export: true,
      allow_zip_packages: true,
      require_approval_for_official: true,
      require_audit_event_on_preview: true,
      require_audit_event_on_download: true,
      block_current_if_stale: true,
      default_confidentiality_level: "Internal",
      default_format: "PDF",
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const before = await this.settings(user, siteId ? String(siteId) : null);
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      allow_pdf_export: dto.allowPdfExport ?? dto.allow_pdf_export,
      allow_docx_export: dto.allowDocxExport ?? dto.allow_docx_export,
      allow_xlsx_export: dto.allowXlsxExport ?? dto.allow_xlsx_export,
      allow_csv_export: dto.allowCsvExport ?? dto.allow_csv_export,
      allow_zip_packages: dto.allowZipPackages ?? dto.allow_zip_packages,
      require_approval_for_official: dto.requireApprovalForOfficial ?? dto.require_approval_for_official,
      require_audit_event_on_preview: dto.requireAuditEventOnPreview ?? dto.require_audit_event_on_preview,
      require_audit_event_on_download: dto.requireAuditEventOnDownload ?? dto.require_audit_event_on_download,
      block_current_if_stale: dto.blockCurrentIfStale ?? dto.block_current_if_stale,
      default_confidentiality_level: dto.defaultConfidentialityLevel ?? dto.default_confidentiality_level,
      settings_json: dto.settings ?? dto.settings_json,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const saved = before.id
      ? await this.db.single<Row>(this.db.from("audit_report_settings").update(payload).eq("company_id", user.tenantId).eq("id", before.id).select().single())
      : await this.db.single<Row>(this.db.from("audit_report_settings").insert(payload).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId, actorId: user.id, type: "Audit Report Settings Updated", title: "Audit Report Settings Updated", before, after: saved });
    return saved;
  }

  sourceReports(user: RequestUser, sourceModule: string, sourceRecordId: string, query: Row = {}) {
    return this.register(user, { ...query, sourceModule: this.sourceLabel(this.normalizeSource(sourceModule)), sourceRecordId });
  }

  sourceGenerate(user: RequestUser, sourceModule: string, sourceRecordId: string, dto: Row = {}) {
    return this.generate(user, { ...dto, sourceModule, sourceRecordId });
  }

  private async runValidation(user: RequestUser, report: Row) {
    await this.db.from("audit_report_validation_results").delete().eq("company_id", user.tenantId).eq("report_id", report.id);
    const checks = [
      { check_key: "source_snapshot", check_title: "Source snapshot captured", check_status: report.source_snapshot_hash ? "Passed" : "Failed", severity: report.source_snapshot_hash ? "Info" : "Critical", message: report.source_snapshot_hash ? "Snapshot hash is present." : "Source snapshot hash is missing." },
      { check_key: "sections", check_title: "Report sections configured", check_status: (report.included_sections_json ?? []).length ? "Passed" : "Failed", severity: "High", message: "At least one report section must be included." },
      { check_key: "formats", check_title: "Export formats selected", check_status: (report.included_formats_json ?? []).length ? "Passed" : "Warning", severity: "Medium", message: "At least one export format should be selected." },
      { check_key: "staleness", check_title: "Report source is current", check_status: report.stale_status === "Current" ? "Passed" : "Failed", severity: "High", message: report.stale_status === "Current" ? "Source snapshot is current." : "Source snapshot is stale." },
    ];
    for (const check of checks) {
      await this.db.single(this.db.from("audit_report_validation_results").insert({ ...check, company_id: user.tenantId, site_id: report.site_id ?? null, report_id: report.id }).select("id").single());
    }
  }

  private readiness(report: Row, sections: Row[] = [], evidence: Row[] = [], validation: Row[] = []) {
    const blockers: Row[] = [];
    if (!report.source_snapshot_hash) blockers.push({ title: "Missing source snapshot", message: "Generate or refresh the report source snapshot.", severity: "Critical" });
    if (!sections.length && !(report.included_sections_json ?? []).length) blockers.push({ title: "No sections selected", message: "Select at least one report section.", severity: "High" });
    if (report.stale_status && report.stale_status !== "Current" && report.stale_status !== "Approved Historical") blockers.push({ title: "Report is stale", message: report.stale_reason ?? "Source data changed after report generation.", severity: "High" });
    const failed = validation.filter((row) => row.check_status === "Failed");
    if (failed.length) blockers.push({ title: "Validation failed", message: `${failed.length} validation check(s) failed.`, severity: "High" });
    if (evidence.some((row) => row.restricted && !row.redacted)) blockers.push({ title: "Restricted evidence present", message: "Restricted evidence must be redacted or exported with elevated permission.", severity: "Medium" });
    const status = blockers.some((item) => item.severity === "Critical" || item.severity === "High") ? "Blocked" : blockers.length ? "Warning" : "Ready";
    return {
      status,
      blockers,
      readyForExport: status !== "Blocked" && ["Generated", "Approved", "Locked", "Exported", "Historical"].includes(report.report_status),
      readyForApproval: status !== "Blocked" && Boolean(report.approval_required),
      locked: Boolean(report.locked),
      stale: report.stale_status !== "Current",
    };
  }

  private async createSourceLink(user: RequestUser, report: Row, sourceModule: string, sourceRecordId: string, source: Row) {
    await this.db.single(this.db.from("audit_report_source_links").insert({
      company_id: user.tenantId,
      site_id: report.site_id ?? null,
      report_id: report.id,
      linked_module: this.sourceLabel(sourceModule),
      linked_record_type: SOURCE_CONFIG[sourceModule]?.type ?? sourceModule,
      linked_record_id: sourceRecordId,
      linked_record_number: source[this.codeColumn(sourceModule)] ?? null,
      linked_record_title: source[this.titleColumn(sourceModule)] ?? null,
      linked_record_status: source[this.statusColumn(sourceModule)] ?? null,
      snapshot_json: source,
      snapshot_hash: this.hash(source),
      stale_status: "Current",
    }).select("id").single());
  }

  private async createSections(user: RequestUser, report: Row, sections: Row[]) {
    for (const [index, section] of sections.entries()) {
      await this.db.single(this.db.from("audit_report_sections").insert({
        company_id: user.tenantId,
        site_id: report.site_id ?? null,
        report_id: report.id,
        section_key: section.key ?? section.section_key ?? `section_${index + 1}`,
        section_title: section.title ?? section.section_title ?? `Section ${index + 1}`,
        section_order: Number(section.order ?? section.section_order ?? index + 1),
        included: this.bool(section.included, true),
        required: this.bool(section.required, false),
        readiness_status: "Not Checked",
        source_module: report.source_module ?? null,
        source_record_id: report.source_record_id ?? null,
        content_snapshot_json: section,
        redacted: this.bool(section.redacted, false),
      }).select("id").single());
    }
  }

  private async createEvidenceItems(user: RequestUser, report: Row) {
    const evidence = await this.safeRows(this.db.from("audit_evidence_records").select("*").eq("company_id", user.tenantId).eq("linked_record_id", report.source_record_id));
    for (const item of evidence.filter((row) => this.canSeeSite(user, row.site_id))) {
      await this.db.single(this.db.from("audit_report_evidence_items").insert({
        company_id: user.tenantId,
        site_id: report.site_id ?? item.site_id ?? null,
        report_id: report.id,
        evidence_id: item.id,
        evidence_code: item.evidence_code ?? null,
        evidence_title: item.evidence_title ?? null,
        evidence_type: item.evidence_type ?? null,
        evidence_status: item.evidence_status ?? null,
        confidentiality_level: item.confidentiality_level ?? null,
        restricted: this.isRestricted(item),
        include_in_report: true,
        include_in_package: true,
        redacted: this.isRestricted(item),
        snapshot_json: this.isRestricted(item) ? { redacted: true, evidence_id: item.id } : item,
      }).select("id").single());
    }
  }

  private async createJob(user: RequestUser, report: Row, jobType: string, dto: Row) {
    return this.db.single<Row>(this.db.from("audit_report_generation_jobs").insert({
      company_id: user.tenantId,
      site_id: report.site_id ?? null,
      report_id: report.id,
      job_type: jobType,
      job_status: "Completed",
      requested_format: dto.format ?? (report.included_formats_json ?? [])[0] ?? "PDF",
      requested_formats_json: dto.formats ?? report.included_formats_json ?? ["PDF"],
      requested_by: user.id,
      progress_percent: 100,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      job_payload_json: dto,
      result_json: { manifestHash: this.hash(report.report_manifest_json ?? report.source_snapshot_json ?? report) },
    }).select().single());
  }

  private async createFileRecord(user: RequestUser, report: Row, job: Row | null, dto: Row) {
    const formats = Array.isArray(dto.formats) && dto.formats.length ? dto.formats : report.included_formats_json ?? ["PDF"];
    for (const format of formats) {
      await this.db.single(this.db.from("audit_report_files").insert({
        company_id: user.tenantId,
        site_id: report.site_id ?? null,
        report_id: report.id,
        job_id: job?.id ?? null,
        file_name: `${report.report_code}-${String(format).toLowerCase()}.${String(format).toLowerCase()}`,
        file_format: format,
        file_status: dto.storagePath || dto.storage_path ? "Generated" : "Metadata Only",
        storage_bucket: dto.storageBucket ?? dto.storage_bucket ?? null,
        storage_path: dto.storagePath ?? dto.storage_path ?? null,
        storage_object_id: dto.storageObjectId ?? dto.storage_object_id ?? null,
        checksum: this.hash({ reportId: report.id, format, generatedAt: report.generated_at }),
        version_number: 1,
        official: this.bool(dto.official, false),
        created_by: user.id,
      }).select("id").single());
    }
  }

  private async createVersion(user: RequestUser, report: Row, reason: string, versionReason: string | null) {
    const rows = await this.safeRows(this.db.from("audit_report_versions").select("version_number").eq("company_id", user.tenantId).eq("report_id", report.id));
    const version = rows.reduce((max, row) => Math.max(max, Number(row.version_number ?? 0)), 0) + 1;
    await this.db.single(this.db.from("audit_report_versions").insert({
      company_id: user.tenantId,
      site_id: report.site_id ?? null,
      report_id: report.id,
      version_number: version,
      version_status: report.report_status,
      version_reason: versionReason ?? reason,
      report_snapshot_json: report,
      manifest_hash: this.hash(report.report_manifest_json ?? report),
      created_by: user.id,
      locked: Boolean(report.locked),
      locked_at: report.locked_at ?? null,
    }).select("id").single());
  }

  private async createStalenessEvent(user: RequestUser, report: Row, reason: string) {
    await this.db.single(this.db.from("audit_report_staleness_events").insert({
      company_id: user.tenantId,
      site_id: report.site_id ?? null,
      report_id: report.id,
      source_module: report.source_module ?? null,
      source_record_id: report.source_record_id ?? null,
      stale_reason: reason,
      previous_hash: report.source_snapshot_hash ?? null,
    }).select("id").single());
  }

  private async accessEvent(user: RequestUser, report: Row, file: Row | null, accessType: string, status: string) {
    await this.db.single(this.db.from("audit_report_access_events").insert({
      company_id: user.tenantId,
      site_id: report.site_id ?? null,
      report_id: report.id,
      file_id: file?.id ?? null,
      access_type: accessType,
      access_status: status,
      actor_user_id: user.id,
      metadata_json: { fileName: file?.file_name ?? null },
    }).select("id").single());
  }

  private previewFromSnapshot(report: Row, sections: Row[], evidence: Row[], readiness: Row) {
    return {
      title: report.report_title,
      reportCode: report.report_code,
      status: report.report_status,
      source: {
        module: report.source_module,
        recordNumber: report.source_record_number,
        recordTitle: report.source_record_title,
        status: report.source_record_status,
      },
      sectionCount: sections.length || (report.included_sections_json ?? []).length,
      evidenceCount: evidence.length,
      readiness,
      manifest: report.report_manifest_json ?? this.manifestFromSource(String(report.source_module ?? "Report"), report.source_snapshot_json ?? {}, report),
      snapshot: report.restricted ? { redacted: true, message: "Restricted report snapshot hidden without elevated permission." } : report.source_snapshot_json ?? {},
    };
  }

  private manifestFromSource(sourceModule: string, source: Row, dto: Row) {
    return {
      sourceModule: this.sourceLabel(this.normalizeSource(sourceModule)),
      sourceRecordId: source.id ?? dto.sourceRecordId ?? dto.source_record_id ?? null,
      sourceRecordNumber: source[this.codeColumn(this.normalizeSource(sourceModule))] ?? null,
      sourceRecordTitle: source[this.titleColumn(this.normalizeSource(sourceModule))] ?? null,
      generatedAt: new Date().toISOString(),
      formats: dto.formats ?? dto.includedFormats ?? ["PDF"],
      sections: dto.includedSections ?? dto.sections ?? [],
      snapshotHash: this.hash(source),
    };
  }

  private sectionsFromDto(dto: Row, template: Row | null) {
    const sections = dto.sections ?? dto.includedSections ?? dto.included_sections_json ?? template?.section_schema_json?.sections;
    if (Array.isArray(sections) && sections.length) return sections;
    return [
      { key: "executive_summary", title: "Executive Summary", required: true },
      { key: "source_snapshot", title: "Source Snapshot", required: true },
      { key: "findings_capa", title: "Findings and CAPA" },
      { key: "evidence_manifest", title: "Evidence Manifest" },
      { key: "scoring_standards", title: "Scoring and Standards Traceability" },
      { key: "approval_history", title: "Review and Approval" },
    ];
  }

  private filteredSource(report: Row, type: string) {
    const snapshot = report.source_snapshot_json ?? {};
    return report.source_record_type === type ? { source: snapshot, reportId: report.id } : { source: null, message: `This report is not directly sourced from ${type}.` };
  }

  private async report(user: RequestUser, reportId: string) {
    const row = await this.singleById(user, "audit_reports", reportId, "Audit report not found.");
    if (!this.canSeeReport(user, row)) throw new ForbiddenException("You do not have access to this audit report.");
    return row;
  }

  async template(user: RequestUser, templateId: string) {
    return this.singleById(user, "audit_report_templates", templateId, "Audit report template not found.");
  }

  private async file(user: RequestUser, reportId: string, fileId: string) {
    const row = await this.singleById(user, "audit_report_files", fileId, "Audit report file not found.");
    if (row.report_id !== reportId) throw new NotFoundException("Audit report file not found for this report.");
    return row;
  }

  private async sourceRow(user: RequestUser, sourceModule: string, sourceRecordId: string) {
    const config = SOURCE_CONFIG[sourceModule];
    if (!config) throw new BadRequestException("Unsupported audit report source module.");
    const row = await this.db.single<Row>(this.db.from(config.table).select("*").eq("company_id", user.tenantId).eq("id", sourceRecordId).single());
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Source record is outside your selected site access.");
    return row;
  }

  private async children(user: RequestUser, table: string, parentId: string, parentColumn: string, order = "created_at", ascending = false) {
    const rows = await this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(parentColumn, parentId).order(order, { ascending }));
    return rows.filter((row) => this.canSeeSite(user, row.site_id));
  }

  private async list(user: RequestUser, table: string, query: Row, defaultSort: string, custom?: (request: any, query: Row) => any, desc = true) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from(table).select("*", { count: "exact" }).eq("company_id", user.tenantId);
    const siteId = query.siteId ?? user.selectedSiteId;
    if (siteId) {
      this.assertSite(user, String(siteId));
      request = request.eq("site_id", siteId);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`id.ilike.%${search}%`);
    }
    if (custom) request = custom(request, query);
    const sort = String(query.sort ?? `${defaultSort}.${desc ? "desc" : "asc"}`);
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || defaultSort, { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = ((data ?? []) as Row[]).filter((row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit };
  }

  private async singleById(user: RequestUser, table: string, id: string, message: string) {
    const { data, error } = await this.db.from(table).select("*").eq("company_id", user.tenantId).eq("id", id).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException(message);
    if (!this.canSeeSite(user, (data as Row).site_id)) throw new ForbiddenException("Record is outside your selected site access.");
    return data as Row;
  }

  private async safeRows(builder: any) {
    const { data, error } = await builder;
    if (error) return [];
    return (data ?? []) as Row[];
  }

  private async write(user: RequestUser, report: Row, title: string, description: string, before: Row | null, after: Row, job?: Row | null) {
    await this.history.write({
      tenantId: user.tenantId,
      siteId: report.site_id ?? null,
      actorId: user.id,
      reportId: report.id,
      jobId: job?.id ?? null,
      type: title,
      title,
      description,
      before,
      after,
    });
  }

  private summary(rows: Row[], jobs: Row[] = [], downloads: Row[] = []) {
    return {
      total: rows.length,
      draft: rows.filter((row) => row.report_status === "Draft").length,
      generated: rows.filter((row) => row.report_status === "Generated").length,
      pendingApproval: rows.filter((row) => row.report_status === "Pending Approval").length,
      approved: rows.filter((row) => row.report_status === "Approved").length,
      locked: rows.filter((row) => row.locked || row.report_status === "Locked").length,
      stale: rows.filter((row) => row.stale_status && row.stale_status !== "Current").length,
      failed: rows.filter((row) => row.report_status === "Failed").length + jobs.filter((row) => row.job_status === "Failed").length,
      exported: rows.filter((row) => row.report_status === "Exported").length,
      archived: rows.filter((row) => row.report_status === "Archived" || row.archived_at).length,
      downloadsTracked: downloads.length,
      restricted: rows.filter((row) => row.restricted).length,
    };
  }

  private group(rows: Row[], key: string) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = String(row[key] ?? "Unassigned");
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({ key: value, label: value, count }));
  }

  private applyReportView(request: any, view: string) {
    if (view === "draft") return request.eq("report_status", "Draft");
    if (view === "generated") return request.eq("report_status", "Generated");
    if (view === "pending-approval") return request.eq("report_status", "Pending Approval");
    if (view === "approved") return request.eq("report_status", "Approved");
    if (view === "locked") return request.eq("locked", true);
    if (view === "stale") return request.neq("stale_status", "Current");
    if (view === "failed") return request.eq("report_status", "Failed");
    if (view === "exported") return request.eq("report_status", "Exported");
    if (view === "archived") return request.not("archived_at", "is", null);
    return request;
  }

  private canSeeReport(user: RequestUser, row: Row) {
    if (!this.canSeeSite(user, row.site_id)) return false;
    if (row.restricted && !(user.permissions ?? []).includes("audit.report.restricted.view")) return false;
    return true;
  }

  private redactReport(user: RequestUser, row: Row) {
    if (!row.restricted || (user.permissions ?? []).includes("audit.report.restricted.view")) return row;
    return { id: row.id, report_code: row.report_code, report_title: "Restricted report", report_status: row.report_status, restricted: true, redacted: true };
  }

  private canSeeSite(user: RequestUser, siteId?: string | null) {
    if (!siteId || user.corporateView) return true;
    if (user.selectedSiteId && user.selectedSiteId === siteId) return true;
    return (user.siteIds ?? []).includes(siteId);
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (!this.canSeeSite(user, siteId)) throw new ForbiddenException("Selected site is outside your access scope.");
  }

  private assertEditable(user: RequestUser, row: Row) {
    if (row.locked || ["Locked", "Approved"].includes(row.report_status)) {
      if (!(user.permissions ?? []).includes("audit.report.unlock")) throw new ForbiddenException("Approved or locked reports are read-only unless you can unlock/regenerate them.");
    }
  }

  private isRestricted(row: Row) {
    return Boolean(row.restricted) || ["Restricted", "Legal Privileged", "Medical / Personal"].includes(String(row.confidentiality_level ?? ""));
  }

  private normalizeSource(value: any) {
    return String(value ?? "").trim().toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
  }

  private sourceLabel(value: string) {
    const normalized = this.normalizeSource(value);
    return SOURCE_CONFIG[normalized]?.type ?? normalized.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  private codeColumn(sourceModule: string) {
    return SOURCE_CONFIG[this.normalizeSource(sourceModule)]?.code ?? "id";
  }

  private titleColumn(sourceModule: string) {
    return SOURCE_CONFIG[this.normalizeSource(sourceModule)]?.title ?? "id";
  }

  private statusColumn(sourceModule: string) {
    return SOURCE_CONFIG[this.normalizeSource(sourceModule)]?.status ?? "status";
  }

  private sourceId(sourceModule: string, target: string, sourceRecordId: string, source: Row) {
    const normalized = this.normalizeSource(sourceModule);
    if (normalized === target || (target === "approval" && normalized === "review-approval") || (target === "scoring" && normalized === "score-run")) return sourceRecordId;
    const key = `${target}_id`;
    return source[key] ?? null;
  }

  private reportTypeFor(sourceModule: string) {
    const normalized = this.normalizeSource(sourceModule);
    if (normalized === "program") return "Program Summary";
    if (normalized === "plan") return "Plan Report";
    if (normalized === "execution") return "Execution Report";
    if (normalized === "finding") return "Finding Report";
    if (normalized === "capa") return "CAPA Report";
    if (normalized === "evidence") return "Evidence Manifest";
    if (["scoring", "score-run"].includes(normalized)) return "Scoring Report";
    if (normalized === "standards-mapping") return "Standards Traceability";
    if (["approval", "review-approval"].includes(normalized)) return "Review Approval Package";
    return "Custom";
  }

  private async nextCode(user: RequestUser, siteId: string | null) {
    const prefix = `AUD-RPT-${new Date().getFullYear()}`;
    const rows = await this.safeRows(this.db.from("audit_reports").select("report_code").eq("company_id", user.tenantId).like("report_code", `${prefix}-%`));
    return `${prefix}-${String(rows.length + 1).padStart(6, "0")}`;
  }

  private async nextPackageCode(user: RequestUser, siteId: string | null) {
    const prefix = `AUD-RPK-${new Date().getFullYear()}`;
    const rows = await this.safeRows(this.db.from("audit_report_package_foundations").select("package_code").eq("company_id", user.tenantId).like("package_code", `${prefix}-%`));
    return `${prefix}-${String(rows.length + 1).padStart(6, "0")}`;
  }

  private hash(value: unknown) {
    return createHash("sha256").update(JSON.stringify(value ?? {})).digest("hex");
  }

  private bool(value: any, fallback = false) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
  }

  private truthy(value: any) {
    return this.bool(value, false);
  }

  private withoutUndefined<T extends Row>(row: T): T {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as T;
  }
}
