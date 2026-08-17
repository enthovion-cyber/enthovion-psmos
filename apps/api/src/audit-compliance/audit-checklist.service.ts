import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { AuditChecklistHistoryService } from "./audit-checklist-history.service";
import { AuditChecklistNotificationAdapterService } from "./audit-checklist-notification-adapter.service";

type Row = Record<string, any>;
const CHILD_TABLES: Row = {
  scope: "audit_checklist_scopes",
  standards: "audit_checklist_standards",
  modules: "audit_checklist_modules",
  sections: "audit_checklist_sections",
  items: "audit_checklist_items",
};

@Injectable()
export class AuditChecklistService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditChecklistHistoryService,
    private readonly notifications: AuditChecklistNotificationAdapterService,
  ) {}

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db
      .from("audit_checklist_templates")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId);
    const siteId = query.siteId ?? user.selectedSiteId;
    if (siteId && !user.corporateView) {
      this.assertSite(user, siteId);
      request = request.eq("site_id", siteId);
    }
    const filters: Row = {
      status: "checklist_status",
      templateType: "template_type",
      auditType: "audit_type",
      criticality: "criticality",
      ownerUserId: "owner_user_id",
      reviewerUserId: "reviewer_user_id",
      programId: "source_program_id",
      planId: "source_plan_id",
      readinessHealth: "readiness_health",
    };
    for (const [key, column] of Object.entries(filters))
      if (query[key]) request = request.eq(column, query[key]);
    if (query.search) {
      const search = this.safe(query.search);
      request = request.or(
        `checklist_code.ilike.%${search}%,checklist_title.ilike.%${search}%`,
      );
    }
    const [sort, direction] = String(query.sort ?? "updated_at.desc").split(
      ".",
    );
    request = request
      .order(sort ?? "updated_at", { ascending: direction === "asc" })
      .range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await request;
    if (error) throw new BadRequestException(error.message);
    const rows = await Promise.all(
      (data ?? []).map((row: Row) => this.enrich(row)),
    );
    return {
      rows,
      total: count ?? rows.length,
      page,
      limit,
      summary: this.summary(rows),
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const result = await this.register(user, { ...query, page: 1, limit: 250 });
    const rows = result.rows;
    return {
      summary: this.summary(rows),
      byStatus: this.group(rows, "checklist_status"),
      bySite: this.group(rows, "site_id"),
      byAuditType: this.group(rows, "audit_type"),
      byProgram: this.group(rows, "source_program_id"),
      configurationGaps: rows.filter((row) => !row.ready_for_execution),
      pendingReview: rows.filter(
        (row) => row.checklist_status === "Pending Review",
      ),
      reviewOverdue: rows.filter(
        (row) => row.checklist_status === "Review Overdue",
      ),
      recent: [...rows]
        .sort((a, b) =>
          String(b.updated_at).localeCompare(String(a.updated_at)),
        )
        .slice(0, 10),
      safetyCriticalPreview: rows
        .filter((row) => row.safety_critical_items > 0)
        .slice(0, 10),
      plansMissingChecklist: await this.plansMissing(user),
    };
  }

  async context(user: RequestUser) {
    const [programs, plans, sites, units, areas, users] = await Promise.all([
      this.db.many<Row>(
        this.db
          .from("audit_programs")
          .select(
            "id,program_code,program_title,program_status,site_id,audit_type,criticality,owner_user_id,reviewer_user_id",
          )
          .eq("company_id", user.tenantId)
          .order("program_title"),
      ),
      this.db.many<Row>(
        this.db
          .from("audit_plans")
          .select(
            "id,plan_code,plan_title,plan_status,site_id,program_id,audit_type,criticality,owner_user_id,reviewer_user_id",
          )
          .eq("company_id", user.tenantId)
          .order("plan_title"),
      ),
      this.db.many<Row>(
        this.db
          .from("Site")
          .select("id,name,tenantId")
          .eq("tenantId", user.tenantId)
          .order("name"),
      ),
      this.db
        .many<Row>(this.db.from("Unit").select("id,name,siteId").order("name"))
        .catch(() => []),
      this.db
        .many<Row>(
          this.db.from("Area").select("id,name,unitId,siteId").order("name"),
        )
        .catch(() => []),
      this.db.many<Row>(
        this.db
          .from("User")
          .select("id,displayName,email,status,tenantId")
          .eq("tenantId", user.tenantId)
          .eq("status", "ACTIVE")
          .order("displayName"),
      ),
    ]);
    return {
      programs,
      plans,
      sites: sites.filter(
        (site) =>
          user.corporateView ||
          user.isCompanyAdmin ||
          user.siteIds.includes(site.id),
      ),
      units,
      areas,
      users,
      lookups: this.lookups(),
    };
  }

  async create(user: RequestUser, dto: Row) {
    this.validateIdentity(dto);
    const siteId = dto.siteId ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, siteId);
    else if (!user.corporateView && !user.isCompanyAdmin)
      throw new ForbiddenException(
        "Company-wide checklist templates require company administrator access.",
      );
    await this.validateLinks(user, dto, siteId);
    await this.validateUsers(user, dto);
    const row = await this.db.single<Row>(
      this.db
        .from("audit_checklist_templates")
        .insert(
          this.compact({
            company_id: user.tenantId,
            site_id: siteId,
            checklist_code: dto.checklistCode,
            checklist_title: dto.checklistTitle,
            description: dto.description,
            template_type: dto.templateType,
            audit_type: dto.auditType,
            checklist_category: dto.checklistCategory,
            criticality: dto.criticality,
            checklist_status: "Draft",
            version: dto.version ?? "1.0",
            effective_date: dto.effectiveDate,
            checklist_objective: dto.checklistObjective,
            owner_user_id: dto.ownerUserId,
            reviewer_user_id: dto.reviewerUserId,
            approval_owner_user_id: dto.approvalOwnerUserId,
            next_review_due: dto.nextReviewDue,
            review_frequency: dto.reviewFrequency,
            source_program_id: dto.programId,
            source_plan_id: dto.planId,
            standalone_checklist: Boolean(dto.standaloneChecklist),
            standalone_reason: dto.standaloneReason,
            source_snapshot_json: await this.snapshot(user, dto),
            evidence_response_rules_json: dto.evidenceResponseRules ?? {},
            version_notes: dto.versionNotes,
            governance_notes: dto.governanceNotes,
            created_by: user.id,
            updated_by: user.id,
          }),
        )
        .select()
        .single(),
    );
    await this.copySourceConfiguration(user, row, dto);
    await this.record(
      user,
      row,
      "Checklist Created",
      `Checklist ${row.checklist_code} created`,
      undefined,
      row,
    );
    return this.detail(user, row.id);
  }

  async detail(user: RequestUser, id: string) {
    const template = await this.template(user, id);
    const [
      scope,
      standards,
      modules,
      sections,
      items,
      assignments,
      versions,
      reviews,
      checks,
      history,
    ] = await Promise.all([
      this.children(user, id, "scope"),
      this.children(user, id, "standards"),
      this.children(user, id, "modules"),
      this.children(user, id, "sections"),
      this.children(user, id, "items"),
      this.db.many<Row>(
        this.db
          .from("audit_checklist_assignments")
          .select("*")
          .eq("company_id", user.tenantId)
          .eq("checklist_id", id)
          .is("removed_at", null)
          .order("assigned_at"),
      ),
      this.db.many<Row>(
        this.db
          .from("audit_checklist_version_records")
          .select("*")
          .eq("company_id", user.tenantId)
          .eq("checklist_id", id)
          .order("created_at", { ascending: false }),
      ),
      this.db.many<Row>(
        this.db
          .from("audit_checklist_review_records")
          .select("*")
          .eq("company_id", user.tenantId)
          .eq("checklist_id", id)
          .order("created_at", { ascending: false }),
      ),
      this.db.many<Row>(
        this.db
          .from("audit_checklist_readiness_checks")
          .select("*")
          .eq("company_id", user.tenantId)
          .eq("checklist_id", id)
          .order("checked_at", { ascending: false })
          .limit(1),
      ),
      this.historyRows(user, id).then((result) => result.rows),
    ]);
    return {
      template: await this.enrich(template),
      scope,
      standards,
      modules,
      sections,
      items,
      assignments,
      versions,
      reviews,
      readiness: checks[0] ?? null,
      history,
    };
  }

  async update(user: RequestUser, id: string, dto: Row) {
    const before = await this.template(user, id);
    this.assertMutable(before);
    if (dto.siteId) this.assertSite(user, dto.siteId);
    await this.validateLinks(user, dto, dto.siteId ?? before.site_id);
    await this.validateUsers(user, dto);
    const patch = this.compact({
      checklist_title: dto.checklistTitle,
      checklist_code: dto.checklistCode,
      description: dto.description,
      template_type: dto.templateType,
      audit_type: dto.auditType,
      checklist_category: dto.checklistCategory,
      criticality: dto.criticality,
      effective_date: dto.effectiveDate,
      checklist_objective: dto.checklistObjective,
      owner_user_id: dto.ownerUserId,
      reviewer_user_id: dto.reviewerUserId,
      approval_owner_user_id: dto.approvalOwnerUserId,
      next_review_due: dto.nextReviewDue,
      review_frequency: dto.reviewFrequency,
      source_program_id: dto.programId,
      source_plan_id: dto.planId,
      standalone_checklist: dto.standaloneChecklist,
      standalone_reason: dto.standaloneReason,
      evidence_response_rules_json: dto.evidenceResponseRules,
      version_notes: dto.versionNotes,
      governance_notes: dto.governanceNotes,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_checklist_templates")
        .update(patch)
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .select()
        .single(),
    );
    await this.record(
      user,
      saved,
      "Checklist Updated",
      `Checklist ${saved.checklist_code} updated`,
      before,
      saved,
    );
    await this.readiness(user, id);
    return this.detail(user, id);
  }

  async transition(
    user: RequestUser,
    id: string,
    action: string,
    dto: Row = {},
  ) {
    const before = await this.template(user, id);
    const now = new Date().toISOString();
    let patch: Row = {};
    if (action === "activate") {
      const readiness = await this.readiness(user, id);
      if (!readiness.ready_for_execution)
        throw new BadRequestException(
          `Activation blocked: ${readiness.missing_items_json.join(", ")}`,
        );
      patch = {
        checklist_status: "Active",
        current_version: true,
        activated_by: user.id,
        activated_at: now,
      };
    } else if (action === "archive") {
      this.reason(dto);
      patch = {
        checklist_status: "Archived",
        current_version: false,
        archived_by: user.id,
        archived_at: now,
        archive_reason: dto.reason,
      };
    } else if (action === "reactivate") {
      if (before.checklist_status !== "Archived")
        throw new BadRequestException(
          "Only archived checklists can be reactivated.",
        );
      patch = {
        checklist_status: "Draft",
        archived_by: null,
        archived_at: null,
        archive_reason: null,
      };
    } else if (action === "submit-review") {
      if (!before.reviewer_user_id)
        throw new BadRequestException("Assign a reviewer before submission.");
      patch = { checklist_status: "Pending Review" };
      await this.db.single(
        this.db
          .from("audit_checklist_review_records")
          .insert({
            company_id: user.tenantId,
            site_id: before.site_id,
            checklist_id: id,
            review_status: "Pending",
            submitted_by: user.id,
            submitted_at: now,
          })
          .select("id")
          .single(),
      );
    } else throw new BadRequestException("Unsupported checklist transition.");
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_checklist_templates")
        .update({ ...patch, updated_by: user.id, updated_at: now })
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .select()
        .single(),
    );
    await this.record(
      user,
      saved,
      action,
      `Checklist ${action}`,
      before,
      saved,
      dto.reason,
    );
    if (action === "submit-review")
      await this.notifications.notify({
        tenantId: user.tenantId,
        siteId: saved.site_id,
        checklistId: saved.id,
        code: saved.checklist_code,
        title: saved.checklist_title,
        message: "A checklist has been submitted for your review.",
        userIds: [saved.reviewer_user_id],
      });
    return this.detail(user, id);
  }

  async review(
    user: RequestUser,
    id: string,
    decision: "approve" | "reject",
    dto: Row = {},
  ) {
    const before = await this.template(user, id);
    if (before.checklist_status !== "Pending Review")
      throw new BadRequestException("Checklist is not pending review.");
    if (decision === "reject") this.reason(dto);
    const readiness = await this.readiness(user, id);
    if (decision === "approve" && !readiness.ready_for_execution)
      throw new BadRequestException(
        `Approval blocked: ${readiness.missing_items_json.join(", ")}`,
      );
    const now = new Date().toISOString();
    await this.db.many(
      this.db
        .from("audit_checklist_review_records")
        .update({
          review_status: decision === "approve" ? "Approved" : "Rejected",
          reviewed_by: user.id,
          reviewed_at: now,
          review_comment: dto.comment ?? dto.reason,
          updated_at: now,
        })
        .eq("company_id", user.tenantId)
        .eq("checklist_id", id)
        .eq("review_status", "Pending"),
    );
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_checklist_templates")
        .update({
          checklist_status: decision === "approve" ? "Approved" : "In Builder",
          current_version: decision === "approve",
          updated_by: user.id,
          updated_at: now,
        })
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .select()
        .single(),
    );
    await this.record(
      user,
      saved,
      `Checklist ${decision}`,
      `Checklist ${decision}`,
      before,
      saved,
      dto.comment ?? dto.reason,
    );
    return this.detail(user, id);
  }

  async duplicate(user: RequestUser, id: string, dto: Row = {}) {
    const source: any = await this.detail(user, id);
    const copy: any = await this.create(user, {
      checklistCode:
        dto.checklistCode ?? `${source.template.checklist_code}-COPY`,
      checklistTitle:
        dto.checklistTitle ?? `${source.template.checklist_title} Copy`,
      templateType: source.template.template_type,
      auditType: source.template.audit_type,
      criticality: source.template.criticality,
      siteId: source.template.site_id,
      standaloneChecklist: true,
      standaloneReason: "Copied from checklist template",
    });
    await this.copyChildren(user, source, copy.template.id);
    return this.detail(user, copy.template.id);
  }
  async createVersion(user: RequestUser, id: string, dto: Row) {
    this.reason(dto);
    const source: any = await this.detail(user, id);
    const version = dto.version ?? this.nextVersion(source.template.version);
    const copy: any = await this.create(user, {
      checklistCode: source.template.checklist_code,
      checklistTitle: source.template.checklist_title,
      templateType: source.template.template_type,
      auditType: source.template.audit_type,
      criticality: source.template.criticality,
      siteId: source.template.site_id,
      version,
      programId: source.template.source_program_id,
      planId: source.template.source_plan_id,
      ownerUserId: source.template.owner_user_id,
      reviewerUserId: source.template.reviewer_user_id,
      nextReviewDue: source.template.next_review_due,
      versionNotes: dto.versionNotes,
      standaloneChecklist: source.template.standalone_checklist,
      standaloneReason: source.template.standalone_reason,
    });
    await this.copyChildren(user, source, copy.template.id);
    await this.db.single(
      this.db
        .from("audit_checklist_version_records")
        .insert({
          company_id: user.tenantId,
          site_id: source.template.site_id,
          checklist_id: copy.template.id,
          version,
          version_status: "Draft",
          version_notes: dto.versionNotes,
          change_reason: dto.reason,
          created_from_checklist_id: id,
          created_by: user.id,
        })
        .select("id")
        .single(),
    );
    return this.detail(user, copy.template.id);
  }

  async children(user: RequestUser, id: string, kind: string) {
    await this.template(user, id);
    return this.db.many<Row>(
      this.db
        .from(this.childTable(kind))
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("checklist_id", id)
        .is("removed_at", null)
        .order(
          kind === "sections"
            ? "section_order"
            : kind === "items"
              ? "item_order"
              : "created_at",
        ),
    );
  }
  async saveChild(
    user: RequestUser,
    id: string,
    kind: string,
    dto: Row,
    rowId?: string,
  ) {
    const template = await this.template(user, id);
    this.assertMutable(template);
    if (kind === "items" && !dto.sectionId && !rowId)
      throw new BadRequestException("Section is required.");
    const table = this.childTable(kind);
    const payload = this.childPayload(user, template, kind, dto);
    const saved = rowId
      ? await this.db.single<Row>(
          this.db
            .from(table)
            .update({
              ...payload,
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq("company_id", user.tenantId)
            .eq("checklist_id", id)
            .eq("id", rowId)
            .select()
            .single(),
        )
      : await this.db.single<Row>(
          this.db.from(table).insert(payload).select().single(),
        );
    await this.record(
      user,
      template,
      `${kind} ${rowId ? "updated" : "created"}`,
      `${kind} ${rowId ? "updated" : "created"}`,
      undefined,
      saved,
    );
    await this.readiness(user, id);
    return saved;
  }
  async removeChild(
    user: RequestUser,
    id: string,
    kind: string,
    rowId: string,
    dto: Row,
  ) {
    this.reason(dto);
    const template = await this.template(user, id);
    this.assertMutable(template);
    await this.db.single(
      this.db
        .from(this.childTable(kind))
        .update({
          removed_at: new Date().toISOString(),
          removed_by: user.id,
          remove_reason: dto.reason,
        })
        .eq("company_id", user.tenantId)
        .eq("checklist_id", id)
        .eq("id", rowId)
        .select("id")
        .single(),
    );
    await this.record(
      user,
      template,
      `${kind} removed`,
      `${kind} removed`,
      undefined,
      { id: rowId },
      dto.reason,
    );
    await this.readiness(user, id);
    return { deleted: true };
  }
  async reorder(
    user: RequestUser,
    id: string,
    kind: "sections" | "items",
    dto: Row,
  ) {
    const template = await this.template(user, id);
    this.assertMutable(template);
    const ids = Array.isArray(dto.ids) ? dto.ids : [];
    if (!ids.length) throw new BadRequestException("Ordered IDs are required.");
    const column = kind === "sections" ? "section_order" : "item_order";
    for (let index = 0; index < ids.length; index += 1)
      await this.db.many(
        this.db
          .from(this.childTable(kind))
          .update({
            [column]: index + 1,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("company_id", user.tenantId)
          .eq("checklist_id", id)
          .eq("id", ids[index]),
      );
    await this.record(
      user,
      template,
      `${kind} reordered`,
      `${kind} reordered`,
      undefined,
      { ids },
    );
    return this.children(user, id, kind);
  }
  async duplicateItem(
    user: RequestUser,
    id: string,
    itemId: string,
    dto: Row = {},
  ) {
    const template = await this.template(user, id);
    this.assertMutable(template);
    const item = await this.item(user, id, itemId);
    const copy = this.compact({
      ...item,
      id: undefined,
      item_code: dto.itemCode ?? `${item.item_code}-COPY`,
      item_order: dto.itemOrder ?? item.item_order + 1,
      created_at: undefined,
      updated_at: undefined,
      removed_at: null,
      removed_by: null,
      remove_reason: null,
      created_by: user.id,
      updated_by: user.id,
    });
    const saved = await this.db.single<Row>(
      this.db.from("audit_checklist_items").insert(copy).select().single(),
    );
    await this.record(
      user,
      template,
      "Item Duplicated",
      `Checklist item ${item.item_code} duplicated`,
      item,
      saved,
    );
    await this.readiness(user, id);
    return saved;
  }
  async moveItem(user: RequestUser, id: string, itemId: string, dto: Row) {
    if (!dto.sectionId)
      throw new BadRequestException("Target section is required.");
    return this.saveChild(
      user,
      id,
      "items",
      { sectionId: dto.sectionId, itemOrder: dto.itemOrder ?? 1 },
      itemId,
    );
  }

  async questionBank(user: RequestUser, query: Row = {}) {
    let request: any = this.db
      .from("audit_question_bank")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId);
    const siteId = query.siteId ?? user.selectedSiteId;
    if (siteId && !user.corporateView) request = request.eq("site_id", siteId);
    if (query.status) request = request.eq("question_status", query.status);
    if (query.search) {
      const search = this.safe(query.search);
      request = request.or(
        `question_code.ilike.%${search}%,question_text.ilike.%${search}%`,
      );
    }
    const { data, count, error } = await request
      .order("updated_at", { ascending: false })
      .limit(250);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  }
  async question(user: RequestUser, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("audit_question_bank")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Question not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }
  async saveQuestion(user: RequestUser, dto: Row, id?: string) {
    if (
      !dto.questionCode ||
      !dto.questionText ||
      !dto.questionType ||
      !dto.responseType
    )
      throw new BadRequestException(
        "Question code, text, type, and response type are required.",
      );
    const before = id ? await this.question(user, id) : null;
    if (
      before &&
      ["Approved", "Archived", "Superseded"].includes(before.question_status)
    )
      throw new BadRequestException(
        "Create a new version of this locked question.",
      );
    const payload = this.compact({
      company_id: user.tenantId,
      site_id: dto.siteId ?? user.selectedSiteId ?? null,
      question_code: dto.questionCode,
      question_text: dto.questionText,
      question_type: dto.questionType,
      response_type: dto.responseType,
      category: dto.category,
      standard_name: dto.standardName,
      jurisdiction: dto.jurisdiction,
      clause_reference: dto.clauseReference,
      module_key: dto.moduleKey,
      evidence_expectation: dto.evidenceExpectation,
      criticality: dto.criticality,
      default_severity: dto.defaultSeverity,
      default_guidance: dto.defaultGuidance,
      default_response_rules_json: dto.defaultResponseRules,
      owner_user_id: dto.ownerUserId,
      question_status: dto.questionStatus ?? "Draft",
      version: dto.version ?? "1.0",
      tags_json: dto.tags ?? [],
      created_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const row = id
      ? await this.db.single<Row>(
          this.db
            .from("audit_question_bank")
            .update(payload)
            .eq("company_id", user.tenantId)
            .eq("id", id)
            .select()
            .single(),
        )
      : await this.db.single<Row>(
          this.db.from("audit_question_bank").insert(payload).select().single(),
        );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      questionBankId: row.id,
      siteId: row.site_id,
      type: `Question ${id ? "Updated" : "Created"}`,
      title: `Question ${row.question_code} ${id ? "updated" : "created"}`,
      ...(before ? { before } : {}),
      after: row,
    });
    return row;
  }
  async questionTransition(
    user: RequestUser,
    id: string,
    action: string,
    dto: Row = {},
  ) {
    const before = await this.question(user, id);
    if (action === "create-version") {
      this.reason(dto);
      return this.saveQuestion(user, {
        ...this.present(before),
        questionCode: before.question_code,
        questionText: before.question_text,
        questionType: before.question_type,
        responseType: before.response_type,
        version: dto.version ?? this.nextVersion(before.version),
        questionStatus: "Draft",
      });
    }
    let patch: Row = {};
    if (action === "archive") {
      this.reason(dto);
      patch = {
        question_status: "Archived",
        archived_at: new Date().toISOString(),
        archived_by: user.id,
        archive_reason: dto.reason,
      };
    } else if (action === "reactivate")
      patch = {
        question_status: "Draft",
        archived_at: null,
        archived_by: null,
        archive_reason: null,
      };
    else throw new BadRequestException("Unsupported question action.");
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_question_bank")
        .update({
          ...patch,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      questionBankId: saved.id,
      siteId: saved.site_id,
      type: `Question ${action}`,
      title: `Question ${saved.question_code} ${action}`,
      before,
      after: saved,
      description: dto.reason,
    });
    return saved;
  }
  async addFromQuestionBank(user: RequestUser, id: string, dto: Row) {
    const bank = await this.question(user, dto.questionId);
    return this.saveChild(user, id, "items", {
      sectionId: dto.sectionId,
      itemCode: dto.itemCode ?? bank.question_code,
      itemText: bank.question_text,
      itemOrder: dto.itemOrder ?? 1,
      questionType: bank.question_type,
      responseType: bank.response_type,
      expectedEvidence: bank.evidence_expectation,
      guidanceText: bank.default_guidance,
      severityFoundation: bank.default_severity,
      questionBankId: bank.id,
    });
  }

  async assign(user: RequestUser, planId: string, dto: Row) {
    const plan = await this.plan(user, planId);
    const checklist = await this.template(user, dto.checklistId);
    const settings = await this.settings(user, plan.site_id);
    if (
      !["Active", "Approved", "Current", "Ready For Execution"].includes(
        checklist.checklist_status,
      ) &&
      !settings.allow_draft_checklist_assignment
    )
      throw new BadRequestException(
        "Only approved/current checklists can be assigned by policy.",
      );
    if (checklist.site_id && checklist.site_id !== plan.site_id)
      throw new BadRequestException(
        "Checklist and Audit Plan site scope do not align.",
      );
    const readiness = await this.readiness(user, checklist.id);
    const row = await this.db.single<Row>(
      this.db
        .from("audit_checklist_assignments")
        .insert({
          company_id: user.tenantId,
          site_id: plan.site_id,
          checklist_id: checklist.id,
          plan_id: planId,
          checklist_version: checklist.version,
          primary_checklist: dto.primaryChecklist !== false,
          supplemental_checklist: Boolean(dto.supplementalChecklist),
          assignment_reason: dto.assignmentReason,
          readiness_status: readiness.readiness_status,
          alignment_warnings_json: [],
          assigned_by: user.id,
        })
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      checklistId: checklist.id,
      planId,
      siteId: plan.site_id,
      type: "Checklist Assigned",
      title: `Checklist assigned to ${plan.plan_code}`,
      after: row,
    });
    return row;
  }
  async planChecklist(user: RequestUser, planId: string) {
    await this.plan(user, planId);
    return {
      rows: await this.db.many<Row>(
        this.db
          .from("audit_checklist_assignments")
          .select("*,checklist:audit_checklist_templates(*)")
          .eq("company_id", user.tenantId)
          .eq("plan_id", planId)
          .is("removed_at", null)
          .order("primary_checklist", { ascending: false }),
      ),
    };
  }
  async removeAssignment(
    user: RequestUser,
    planId: string,
    assignmentId: string,
    dto: Row,
  ) {
    this.reason(dto);
    const plan = await this.plan(user, planId);
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_checklist_assignments")
        .update({
          removed_at: new Date().toISOString(),
          removed_by: user.id,
          remove_reason: dto.reason,
        })
        .eq("company_id", user.tenantId)
        .eq("plan_id", planId)
        .eq("id", assignmentId)
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      checklistId: saved.checklist_id,
      planId,
      siteId: plan.site_id,
      type: "Checklist Assignment Removed",
      title: `Checklist assignment removed from ${plan.plan_code}`,
      after: saved,
      description: dto.reason,
    });
    return saved;
  }
  async programChecklists(user: RequestUser, programId: string) {
    await this.program(user, programId);
    return this.register(user, { programId, page: 1, limit: 250 });
  }

  async scoped(
    user: RequestUser,
    column: "unit_id" | "area_id",
    value: string,
    query: Row = {},
  ) {
    const scope = await this.db.many<Row>(
      this.db
        .from("audit_checklist_scopes")
        .select("checklist_id")
        .eq("company_id", user.tenantId)
        .eq(column, value)
        .is("removed_at", null),
    );
    const ids = new Set(scope.map((row) => row.checklist_id));
    const result = await this.register(user, { ...query, page: 1, limit: 250 });
    const rows = result.rows.filter((row) => ids.has(row.id));
    return { ...result, rows, total: rows.length, summary: this.summary(rows) };
  }

  async readiness(user: RequestUser, id: string) {
    const template = await this.template(user, id);
    const [scope, standards, modules, sections, items, settings, approvals] =
      await Promise.all([
        this.children(user, id, "scope"),
        this.children(user, id, "standards"),
        this.children(user, id, "modules"),
        this.children(user, id, "sections"),
        this.children(user, id, "items"),
        this.settings(user, template.site_id),
        this.db.many<Row>(
          this.db
            .from("audit_checklist_review_records")
            .select("id")
            .eq("company_id", user.tenantId)
            .eq("checklist_id", id)
            .eq("review_status", "Approved"),
        ),
      ]);
    const missing: string[] = [];
    if (settings.require_scope_for_activation && !scope.length)
      missing.push("Scope");
    if (settings.require_standards_for_activation && !standards.length)
      missing.push("Standards");
    if (settings.require_modules_for_activation && !modules.length)
      missing.push("Modules");
    if (settings.require_sections_for_activation && !sections.length)
      missing.push("Sections");
    if (settings.require_items_for_activation && !items.length)
      missing.push("Items");
    if (settings.require_owner_for_activation && !template.owner_user_id)
      missing.push("Owner");
    if (settings.require_review_due_for_activation && !template.next_review_due)
      missing.push("Review Due");
    const reviewerRequired =
      (template.criticality === "Safety-Critical" &&
        settings.require_reviewer_for_safety_critical) ||
      (template.criticality === "Regulatory-Critical" &&
        settings.require_reviewer_for_regulatory_critical);
    if (reviewerRequired && !template.reviewer_user_id)
      missing.push("Reviewer");
    if (settings.require_review_approval_for_activation && !approvals.length)
      missing.push("Approval");
    const ready = !missing.length;
    const status = ready ? "Ready For Execution" : `Missing ${missing[0]}`;
    const row = await this.db.single<Row>(
      this.db
        .from("audit_checklist_readiness_checks")
        .insert({
          company_id: user.tenantId,
          site_id: template.site_id,
          checklist_id: id,
          readiness_status: status,
          has_scope: Boolean(scope.length),
          has_standards: Boolean(standards.length),
          has_modules: Boolean(modules.length),
          has_sections: Boolean(sections.length),
          has_items: Boolean(items.length),
          has_owner: Boolean(template.owner_user_id),
          has_review_due: Boolean(template.next_review_due),
          approval_complete: Boolean(approvals.length),
          ready_for_execution: ready,
          missing_items_json: missing,
          warnings_json: template.source_changed
            ? ["Source program/plan changed"]
            : [],
          checked_by: user.id,
        })
        .select()
        .single(),
    );
    await this.db.many(
      this.db
        .from("audit_checklist_templates")
        .update({
          readiness_health: status,
          ready_for_execution: ready,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", user.tenantId)
        .eq("id", id),
    );
    return row;
  }
  async historyRows(user: RequestUser, id?: string) {
    let request: any = this.db
      .from("audit_checklist_history_events")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId);
    if (id) request = request.eq("checklist_id", id);
    const { data, count, error } = await request
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  }
  async settings(user: RequestUser, siteId?: string | null) {
    const target = siteId ?? user.selectedSiteId ?? null;
    let request: any = this.db
      .from("audit_checklist_settings")
      .select("*")
      .eq("company_id", user.tenantId);
    request = target
      ? request.eq("site_id", target)
      : request.is("site_id", null);
    return (
      (await this.db.single<Row>(request.maybeSingle()).catch(() => null)) ?? {
        company_id: user.tenantId,
        site_id: target,
        require_scope_for_activation: true,
        require_standards_for_activation: true,
        require_modules_for_activation: true,
        require_sections_for_activation: true,
        require_items_for_activation: true,
        require_owner_for_activation: true,
        require_reviewer_for_safety_critical: true,
        require_reviewer_for_regulatory_critical: true,
        require_review_due_for_activation: true,
        require_review_approval_for_activation: false,
        lock_approved_checklists: true,
        allow_draft_checklist_assignment: false,
        allow_question_bank: true,
        auto_calculate_readiness: true,
        auto_mark_review_overdue: true,
      }
    );
  }
  async updateSettings(user: RequestUser, dto: Row) {
    const before = await this.settings(user, dto.siteId);
    const row = await this.db.single<Row>(
      this.db
        .from("audit_checklist_settings")
        .upsert({
          ...before,
          ...this.snake(dto),
          id: before.id ?? crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: dto.siteId ?? user.selectedSiteId ?? null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single(),
    );
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      siteId: row.site_id,
      type: "Checklist Settings Updated",
      title: "Checklist settings updated",
      before,
      after: row,
    });
    return row;
  }

  lookups() {
    return {
      checklistStatuses: [
        "Draft",
        "In Builder",
        "Pending Review",
        "Approved",
        "Active",
        "Current",
        "Review Overdue",
        "Configuration Incomplete",
        "Ready For Execution",
        "Superseded",
        "Archived",
      ],
      readinessStatuses: [
        "Complete",
        "Missing Sections",
        "Missing Items",
        "Missing Standards",
        "Missing Modules",
        "Missing Owner",
        "Missing Review Due",
        "Pending Approval",
        "Ready For Execution",
      ],
      templateTypes: [
        "Program Checklist Template",
        "Plan-Specific Checklist",
        "Site Audit Checklist",
        "Unit Audit Checklist",
        "Module Audit Checklist",
        "Regulatory Checklist",
        "PSM Compliance Checklist",
        "PTW Audit Checklist",
        "MOC Audit Checklist",
        "PSSR Audit Checklist",
        "Training Audit Checklist",
        "Mechanical Integrity Checklist",
        "Incident/CAPA Checklist",
        "Document Control Checklist",
        "Contractor Audit Checklist",
        "Custom",
      ],
      questionTypes: [
        "Compliance Verification",
        "Evidence Check",
        "Interview Question",
        "Field Verification",
        "Document Review",
        "System Record Check",
        "Procedure Verification",
        "Training Verification",
        "Equipment Verification",
        "PTW Verification",
        "MOC Verification",
        "PSSR Verification",
        "MI Verification",
        "Incident/CAPA Verification",
        "Custom",
      ],
      responseTypes: [
        "Yes / No / N/A",
        "Compliant / Non-Compliant / N/A",
        "Satisfactory / Unsatisfactory / N/A",
        "Pass / Fail / N/A",
        "Numeric",
        "Text",
        "Date",
        "Select One",
        "Multi Select",
        "Evidence Upload Required",
        "Signature Required foundation",
        "Custom",
      ],
      questionBankStatuses: [
        "Draft",
        "Active",
        "Approved",
        "Review Overdue",
        "Superseded",
        "Archived",
      ],
      criticalities: [
        "Low",
        "Medium",
        "High",
        "Critical",
        "Safety-Critical",
        "Regulatory-Critical",
        "PSM-Critical",
      ],
      standards: [
        "OSHA PSM",
        "EPA RMP",
        "ISO 45001",
        "ISO 14001",
        "ISO 9001",
        "Responsible Care",
        "Company Standard",
        "Site Procedure",
        "Corporate PSM Standard",
        "Local Regulation",
        "Insurance / Loss Prevention Requirement",
        "Industry Best Practice",
        "Custom",
      ],
      modules: [
        "PTW",
        "MOC",
        "PSSR",
        "HAZOP / PHA",
        "LOPA / SIL",
        "PSI",
        "Mechanical Integrity",
        "Incident Investigation",
        "Training & Competency",
        "Document Control",
        "Action Engine / CAPA",
        "Equipment Registry",
        "Chemical / SDS foundation",
        "Emergency Response foundation",
        "Management Review foundation",
        "Custom",
      ],
    };
  }

  private async enrich(row: Row) {
    const [sections, items, standards, modules, assignments] =
      await Promise.all([
        this.db.many<Row>(
          this.db
            .from("audit_checklist_sections")
            .select("id")
            .eq("company_id", row.company_id)
            .eq("checklist_id", row.id)
            .is("removed_at", null),
        ),
        this.db.many<Row>(
          this.db
            .from("audit_checklist_items")
            .select(
              "id,required_response,safety_critical,regulatory_critical,psm_critical",
            )
            .eq("company_id", row.company_id)
            .eq("checklist_id", row.id)
            .is("removed_at", null),
        ),
        this.db.many<Row>(
          this.db
            .from("audit_checklist_standards")
            .select("id")
            .eq("company_id", row.company_id)
            .eq("checklist_id", row.id)
            .is("removed_at", null),
        ),
        this.db.many<Row>(
          this.db
            .from("audit_checklist_modules")
            .select("id")
            .eq("company_id", row.company_id)
            .eq("checklist_id", row.id)
            .is("removed_at", null),
        ),
        this.db.many<Row>(
          this.db
            .from("audit_checklist_assignments")
            .select("id")
            .eq("company_id", row.company_id)
            .eq("checklist_id", row.id)
            .is("removed_at", null),
        ),
      ]);
    return {
      ...row,
      sections_count: sections.length,
      items_count: items.length,
      standards_count: standards.length,
      modules_count: modules.length,
      assignments_count: assignments.length,
      mandatory_items: items.filter((item) => item.required_response).length,
      safety_critical_items: items.filter((item) => item.safety_critical)
        .length,
      regulatory_critical_items: items.filter(
        (item) => item.regulatory_critical,
      ).length,
      psm_critical_items: items.filter((item) => item.psm_critical).length,
    };
  }
  private summary(rows: Row[]) {
    const count = (test: (row: Row) => boolean) => rows.filter(test).length;
    return {
      totalTemplates: rows.length,
      active: count((row) =>
        ["Active", "Current"].includes(row.checklist_status),
      ),
      draft: count((row) => row.checklist_status === "Draft"),
      pendingReview: count((row) => row.checklist_status === "Pending Review"),
      approved: count((row) => row.checklist_status === "Approved"),
      archived: count((row) => row.checklist_status === "Archived"),
      superseded: count((row) => row.checklist_status === "Superseded"),
      reviewOverdue: count((row) => row.checklist_status === "Review Overdue"),
      missingSections: count((row) => !row.sections_count),
      missingItems: count((row) => !row.items_count),
      missingStandards: count((row) => !row.standards_count),
      missingOwner: count((row) => !row.owner_user_id),
      missingApplicability: count(
        (row) => row.readiness_health === "Missing Scope",
      ),
      readyForExecution: count((row) => row.ready_for_execution),
      safetyCriticalItems: rows.reduce(
        (total, row) => total + row.safety_critical_items,
        0,
      ),
      regulatoryCriticalItems: rows.reduce(
        (total, row) => total + row.regulatory_critical_items,
        0,
      ),
      psmCriticalItems: rows.reduce(
        (total, row) => total + row.psm_critical_items,
        0,
      ),
    };
  }
  private async plansMissing(user: RequestUser) {
    const plans = await this.db.many<Row>(
      this.db
        .from("audit_plans")
        .select("id,plan_code,plan_title,site_id")
        .eq("company_id", user.tenantId),
    );
    const assigned = await this.db.many<Row>(
      this.db
        .from("audit_checklist_assignments")
        .select("plan_id")
        .eq("company_id", user.tenantId)
        .is("removed_at", null),
    );
    const ids = new Set(assigned.map((row) => row.plan_id));
    return plans.filter(
      (plan) =>
        !ids.has(plan.id) &&
        (user.corporateView ||
          !plan.site_id ||
          user.siteIds.includes(plan.site_id)),
    );
  }
  private childTable(kind: string) {
    const table = CHILD_TABLES[kind];
    if (!table) throw new BadRequestException("Unsupported checklist section.");
    return table;
  }
  private childPayload(
    user: RequestUser,
    template: Row,
    kind: string,
    dto: Row,
  ) {
    const base = {
      company_id: user.tenantId,
      site_id: template.site_id,
      checklist_id: template.id,
      created_by: user.id,
      updated_by: user.id,
    };
    if (kind === "sections")
      return this.compact({
        ...base,
        section_code: dto.sectionCode,
        section_title: dto.sectionTitle,
        section_description: dto.sectionDescription,
        section_order: dto.sectionOrder,
        section_criticality: dto.sectionCriticality,
        standard_id: dto.standardId,
        module_id: dto.moduleId,
        mandatory: dto.mandatory ?? true,
        notes: dto.notes,
      });
    if (kind === "items")
      return this.compact({
        ...base,
        section_id: dto.sectionId,
        item_code: dto.itemCode,
        item_text: dto.itemText,
        item_order: dto.itemOrder,
        question_type: dto.questionType,
        response_type: dto.responseType,
        required_response: dto.requiredResponse ?? true,
        mandatory_evidence: dto.mandatoryEvidence ?? false,
        may_create_finding: dto.mayCreateFinding ?? true,
        safety_critical: dto.safetyCritical ?? false,
        regulatory_critical: dto.regulatoryCritical ?? false,
        psm_critical: dto.psmCritical ?? false,
        severity_foundation: dto.severityFoundation,
        expected_evidence: dto.expectedEvidence,
        guidance_text: dto.guidanceText,
        standard_id: dto.standardId,
        module_id: dto.moduleId,
        applicability_condition_json: dto.applicabilityCondition,
        not_applicable_allowed: dto.notApplicableAllowed ?? true,
        comments_required: dto.commentsRequired ?? false,
        attachments_allowed: dto.attachmentsAllowed ?? true,
        attachments_required: dto.attachmentsRequired ?? false,
        future_scoring_weight: dto.futureScoringWeight,
        notes: dto.notes,
        question_bank_id: dto.questionBankId,
      });
    if (kind === "standards")
      return this.compact({
        ...base,
        standard_name: dto.standardName,
        jurisdiction: dto.jurisdiction,
        clause_reference: dto.clauseReference,
        requirement_category: dto.requirementCategory,
        applicability: dto.applicability,
        mandatory: dto.mandatory ?? true,
        evidence_expectation: dto.evidenceExpectation,
        regulatory_register_id: dto.regulatoryRegisterId,
        source_from_program: dto.sourceFromProgram ?? false,
        source_from_plan: dto.sourceFromPlan ?? false,
        notes: dto.notes,
      });
    if (kind === "modules")
      return this.compact({
        ...base,
        module_key: dto.moduleKey,
        module_name: dto.moduleName ?? dto.moduleKey,
        coverage_level: dto.coverageLevel,
        coverage_reason: dto.coverageReason,
        evidence_source: dto.evidenceSource,
        required: dto.required ?? true,
        integration_enabled: dto.integrationEnabled ?? true,
        source_from_program: dto.sourceFromProgram ?? false,
        source_from_plan: dto.sourceFromPlan ?? false,
        notes: dto.notes,
      });
    return this.compact({
      ...base,
      scope_type: dto.scopeType,
      site_scope_id: dto.siteScopeId,
      unit_id: dto.unitId,
      area_id: dto.areaId,
      department_id: dto.departmentId,
      equipment_id: dto.equipmentId,
      process_system: dto.processSystem,
      worker_role_scope: dto.workerRoleScope,
      contractor_company_id: dto.contractorCompanyId,
      applicability_description: dto.applicabilityDescription,
      exclusions: dto.exclusions,
      applicability_justification: dto.applicabilityJustification,
      source_from_program: dto.sourceFromProgram ?? false,
      source_from_plan: dto.sourceFromPlan ?? false,
    });
  }
  private async copyChildren(user: RequestUser, source: Row, targetId: string) {
    const sections = new Map<string, string>();
    for (const section of source.sections) {
      const copy = await this.saveChild(user, targetId, "sections", {
        ...this.present(section),
        sectionCode: section.section_code,
        sectionTitle: section.section_title,
        sectionOrder: section.section_order,
      });
      sections.set(section.id, copy.id);
    }
    for (const kind of ["scope", "standards", "modules"])
      for (const row of source[kind])
        await this.saveChild(user, targetId, kind, this.present(row));
    for (const item of source.items)
      await this.saveChild(user, targetId, "items", {
        ...this.present(item),
        sectionId: sections.get(item.section_id),
        itemCode: item.item_code,
        itemText: item.item_text,
        itemOrder: item.item_order,
        questionType: item.question_type,
        responseType: item.response_type,
      });
  }
  private async copySourceConfiguration(
    user: RequestUser,
    template: Row,
    dto: Row,
  ) {
    const source = dto.planId
      ? { prefix: "audit_plan", key: "plan_id", id: dto.planId, plan: true }
      : dto.programId
        ? {
            prefix: "audit_program",
            key: "program_id",
            id: dto.programId,
            plan: false,
          }
        : null;
    if (!source || dto.copySourceConfiguration === false) return;
    const rows = async (suffix: string) =>
      this.db
        .many<Row>(
          this.db
            .from(`${source.prefix}_${suffix}`)
            .select("*")
            .eq("company_id", user.tenantId)
            .eq(source.key, source.id)
            .is("removed_at", null),
        )
        .catch(async () =>
          this.db.many<Row>(
            this.db
              .from(`${source.prefix}_${suffix}`)
              .select("*")
              .eq("company_id", user.tenantId)
              .eq(source.key, source.id),
          ),
        );
    const [scopes, standards, modules] = await Promise.all([
      rows("scopes"),
      rows("standards"),
      rows("modules"),
    ]);
    for (const row of scopes)
      await this.saveChild(user, template.id, "scope", {
        ...this.present(row),
        applicabilityDescription: row.scope_description,
        applicabilityJustification: row.scope_justification,
        sourceFromProgram: !source.plan,
        sourceFromPlan: source.plan,
      });
    for (const row of standards)
      await this.saveChild(user, template.id, "standards", {
        ...this.present(row),
        sourceFromProgram: !source.plan,
        sourceFromPlan: source.plan,
      });
    for (const row of modules)
      await this.saveChild(user, template.id, "modules", {
        ...this.present(row),
        sourceFromProgram: !source.plan,
        sourceFromPlan: source.plan,
      });
  }
  private async snapshot(user: RequestUser, dto: Row) {
    const result: Row = { capturedAt: new Date().toISOString() };
    if (dto.programId) result.program = await this.program(user, dto.programId);
    if (dto.planId) result.plan = await this.plan(user, dto.planId);
    return result;
  }
  private async validateLinks(
    user: RequestUser,
    dto: Row,
    siteId: string | null,
  ) {
    if (dto.programId) {
      const program = await this.program(user, dto.programId);
      if (siteId && program.site_id && program.site_id !== siteId)
        throw new BadRequestException(
          "Program site does not match checklist site.",
        );
    }
    if (dto.planId) {
      const plan = await this.plan(user, dto.planId);
      if (siteId && plan.site_id && plan.site_id !== siteId)
        throw new BadRequestException(
          "Plan site does not match checklist site.",
        );
    }
  }
  private async validateUsers(user: RequestUser, dto: Row) {
    for (const id of [
      dto.ownerUserId,
      dto.reviewerUserId,
      dto.approvalOwnerUserId,
    ])
      if (id) {
        const selected = await this.db.single<Row>(
          this.db
            .from("User")
            .select("id,status")
            .eq("tenantId", user.tenantId)
            .eq("id", id)
            .maybeSingle(),
        );
        if (!selected || selected.status !== "ACTIVE")
          throw new BadRequestException(
            "Selected owner/reviewer is not an active company user.",
          );
      }
  }
  private async template(user: RequestUser, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("audit_checklist_templates")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Checklist not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }
  private async program(user: RequestUser, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("audit_programs")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Audit Program not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }
  private async plan(user: RequestUser, id: string) {
    const row = await this.db.single<Row>(
      this.db
        .from("audit_plans")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("id", id)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Audit Plan not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }
  private async item(user: RequestUser, id: string, itemId: string) {
    await this.template(user, id);
    const row = await this.db.single<Row>(
      this.db
        .from("audit_checklist_items")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("checklist_id", id)
        .eq("id", itemId)
        .maybeSingle(),
    );
    if (!row) throw new NotFoundException("Checklist item not found.");
    return row;
  }
  private async record(
    user: RequestUser,
    template: Row,
    type: string,
    title: string,
    before?: Row,
    after?: Row,
    description?: string,
  ) {
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      checklistId: template.id,
      siteId: template.site_id,
      type,
      title,
      ...(description ? { description } : {}),
      ...(before ? { before } : {}),
      ...(after ? { after } : {}),
    });
  }
  private validateIdentity(dto: Row) {
    const required: Array<[string, string]> = [
      ["checklistTitle", "Checklist title"],
      ["checklistCode", "Checklist code"],
      ["templateType", "Template type"],
      ["auditType", "Audit type"],
      ["criticality", "Criticality"],
    ];
    const missing = required
      .filter(([key]) => !String(dto[key] ?? "").trim())
      .map(([, label]) => label);
    if (missing.length)
      throw new BadRequestException(
        `Missing required fields: ${missing.join(", ")}.`,
      );
  }
  private assertMutable(template: Row) {
    if (
      ["Approved", "Active", "Current", "Superseded", "Archived"].includes(
        template.checklist_status,
      )
    )
      throw new BadRequestException(
        "This checklist version is locked. Create a new version to make changes.",
      );
  }
  private assertSite(user: RequestUser, siteId: string) {
    if (user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return;
    if (!user.siteIds.includes(siteId))
      throw new ForbiddenException("Checklist site is outside your access.");
  }
  private reason(dto: Row) {
    if (!String(dto.reason ?? "").trim())
      throw new BadRequestException("A reason is required.");
  }
  private nextVersion(value: string) {
    const [major, minor] = String(value ?? "1.0")
      .split(".")
      .map(Number);
    return `${major || 1}.${(minor || 0) + 1}`;
  }
  private safe(value: unknown) {
    return String(value)
      .replace(/[,%()]/g, " ")
      .trim();
  }
  private compact(value: Row) {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined),
    );
  }
  private present(row: Row) {
    return Object.entries(row).reduce<Row>((result, [key, value]) => {
      result[key] = value;
      result[
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
      ] = value;
      return result;
    }, {});
  }
  private group(rows: Row[], key: string) {
    return Object.entries(
      rows.reduce((result: Row, row) => {
        const value = String(row[key] ?? "Unassigned");
        result[value] = (result[value] ?? 0) + 1;
        return result;
      }, {}),
    ).map(([label, value]) => ({ label, value }));
  }
  private snake(dto: Row) {
    const result: Row = {};
    for (const [key, value] of Object.entries(dto))
      result[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] =
        value;
    return this.compact(result);
  }
}
